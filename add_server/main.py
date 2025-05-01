import os
import numpy as np
import librosa
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
from scipy.linalg import toeplitz, solve
from scipy.signal import correlate
from joblib import load
import tempfile
import base64
import matplotlib.pyplot as plt

# Initialize FastAPI app
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Paths to the model and scaler
MODEL_PATH = "optimized_audio_deepfake_detector.h5"
SCALER_PATH = "scaler.pkl"

# Load model and scaler
try:
    model = load_model(MODEL_PATH)
    scaler = load(SCALER_PATH)
    print("Model and scaler loaded successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to load model or scaler: {e}")

# Audio processing parameters
SAMPLE_RATE = 16000
DURATION = 3  # in seconds
N_MELS = 128
IMG_WIDTH = 128


# Feature extraction functions
def extract_formants(audio, sr):
    pre_emphasis = 0.97
    emphasized_audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
    lpc_order = 16
    r = correlate(emphasized_audio, emphasized_audio, mode="full")
    r = r[len(r) // 2 :]
    R = toeplitz(r[:lpc_order])
    rhs = -r[1 : lpc_order + 1]
    lpc_coeffs = np.concatenate(([1], solve(R, rhs)))
    roots = [r for r in np.roots(lpc_coeffs) if np.imag(r) >= 0]
    angles = np.angle(roots)
    freqs = angles * (sr / (2 * np.pi))
    return np.array(sorted(freqs)[:3])


def extract_glottal_features(audio_path):
    audio, sr = librosa.load(audio_path, sr=SAMPLE_RATE)
    audio = audio / np.max(np.abs(audio))  # Normalize audio
    pre_emphasis = 0.97
    emphasized_audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
    jitter = np.std(np.diff(emphasized_audio)) / (np.mean(emphasized_audio) + 1e-5)
    shimmer = np.std(emphasized_audio) / (np.mean(emphasized_audio) + 1e-5)
    hnr = 10 * np.log10(
        np.mean(emphasized_audio**2) / (np.var(emphasized_audio) + 1e-5)
    )
    formants = extract_formants(emphasized_audio, sr)
    return np.array([jitter, shimmer, hnr, *formants])


def extract_spectral_features(audio, sr):
    spectrogram = librosa.feature.melspectrogram(
        y=audio, sr=sr, n_mels=N_MELS, fmax=8000
    )
    spectrogram_db = librosa.amplitude_to_db(spectrogram, ref=np.max)
    spectrogram_db = librosa.util.fix_length(spectrogram_db, size=IMG_WIDTH, axis=1)
    return spectrogram_db


def generate_plot(image_array, title):
    plt.figure(figsize=(6, 4))
    plt.imshow(image_array, aspect="auto", origin="lower", cmap="viridis")
    plt.title(title)
    plt.colorbar(format="%+2.0f dB")
    plt.tight_layout()

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        plt.savefig(temp_file.name, format="png")
        temp_file_path = temp_file.name
    plt.close()

    with open(temp_file_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
    os.remove(temp_file_path)
    return encoded_image


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


# Prediction logic
def predict_audio(file_path):
    try:
        audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)
        print(f"Loaded audio: {file_path}, Duration: {len(audio) / sr:.2f}s")

        spectral_features = extract_spectral_features(audio, sr)
        glottal_features = extract_glottal_features(file_path)

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
                "jitter": glottal_features[0],
                "shimmer": glottal_features[1],
                "hnr": glottal_features[2],
                "formants": glottal_features[3:].tolist(),
            },
        }

    except Exception as e:
        print(f"Error processing audio file: {e}")
        return None


# FastAPI route to handle audio file upload and prediction
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


if __name__ == "_main_":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
