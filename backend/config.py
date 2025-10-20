from tensorflow.keras.models import load_model
from joblib import load

# Paths to the model and scaler
MODEL_PATH = "optimized_audio_deepfake_detector.h5"
SCALER_PATH = "scaler.pkl"

# Load model and scaler
model = load_model(MODEL_PATH)
scaler = load(SCALER_PATH)

# Audio processing parameters
SAMPLE_RATE = 16000
N_MELS = 128
IMG_WIDTH = 128
