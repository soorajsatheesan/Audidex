import numpy as np
from audio_processing import load_audio, extract_spectral_features
from utils import generate_plot
from config import model, scaler


def process_chunk(file_path):
    try:
        # Load the chunk
        audio, sr = load_audio(file_path)

        # Extract features
        spectral_features = extract_spectral_features(audio, sr)

        # Normalize and flatten features
        spectral_features = spectral_features / np.max(np.abs(spectral_features))
        flattened_features = spectral_features.flatten()

        # Ensure features match the model input size
        required_length = model.input_shape[1]
        if len(flattened_features) < required_length:
            flattened_features = np.pad(
                flattened_features, (0, required_length - len(flattened_features))
            )
        else:
            flattened_features = flattened_features[:required_length]

        # Normalize using scaler
        normalized_features = scaler.transform(flattened_features.reshape(1, -1))

        # Predict using the model
        prediction = model.predict(normalized_features)
        label = "Real" if np.argmax(prediction) == 0 else "Fake"

        # Generate plots
        mel_spectrogram_plot = generate_plot(spectral_features, "Mel-Spectrogram")

        return {
            "prediction": label,
            "confidence": prediction.tolist(),
            "mel_spectrogram": mel_spectrogram_plot,
        }

    except Exception as e:
        raise RuntimeError(f"Error during prediction: {e}")
