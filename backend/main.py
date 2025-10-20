import os
import numpy as np
import librosa
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import base64
import matplotlib.pyplot as plt

from config import model, scaler, SAMPLE_RATE
from audio_processing import extract_spectral_features, extract_glottal_features
from utils import generate_plot

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_glottal_waveform_plot(audio, sr, label):
    time = np.linspace(0, len(audio) / sr, num=len(audio))
    plt.figure(figsize=(12, 6))
    plt.plot(time, audio, label="Glottal Waveform", color="blue", linewidth=1.2)
    plt.axhline(y=0, color="black", linestyle="--", linewidth=0.8)
    plt.title(f"Estimated Glottal Waveform ({label})", fontsize=16, fontweight="bold")
    plt.xlabel("Time (s)", fontsize=14)
    plt.ylabel("Amplitude", fontsize=14)
    plt.grid(alpha=0.4, linestyle="--")
    plt.legend(loc="upper right", fontsize=12)
    plt.tight_layout()

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        plt.savefig(temp_file.name, format="png")
        temp_file_path = temp_file.name
    plt.close()

    with open(temp_file_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
    os.remove(temp_file_path)
    return encoded_image


def predict_audio(file_path: str):
    try:
        audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)

        spectral_features = extract_spectral_features(audio, sr)
        glottal_features = extract_glottal_features(audio, sr)

        spectral_features = spectral_features / np.max(np.abs(spectral_features))
        flattened_features = spectral_features.flatten()

        combined_features = np.concatenate([flattened_features, glottal_features])

        required_length = model.input_shape[1]
        if len(combined_features) < required_length:
            combined_features = np.pad(
                combined_features, (0, required_length - len(combined_features))
            )
        elif len(combined_features) > required_length:
            combined_features = combined_features[:required_length]

        combined_features = scaler.transform(combined_features.reshape(1, -1))

        prediction = model.predict(combined_features)
        predicted_label = np.argmax(prediction)
        label = "Real" if predicted_label == 0 else "Fake"

        mel_spectrogram_plot = generate_plot(spectral_features, "Mel-Spectrogram")
        glottal_waveform_plot = generate_glottal_waveform_plot(audio, sr, label)

        return {
            "prediction": label,
            "confidence": prediction.tolist(),
            "mel_spectrogram": mel_spectrogram_plot,
            "glottal_waveform": glottal_waveform_plot,
            "glottal_features": {
                "jitter": float(glottal_features[0]),
                "shimmer": float(glottal_features[1]),
                "hnr": float(glottal_features[2]),
                "formants": glottal_features[3:].tolist(),
            },
        }

    except Exception as e:
        print(f"Error processing audio file: {e}")
        return None


@app.post("/predict")
async def predict_audio_api(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name

        result = predict_audio(temp_file_path)
        os.remove(temp_file_path)

        if not result:
            return JSONResponse(
                content={"error": "Error processing the audio file."}, status_code=500
            )
        return result

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
