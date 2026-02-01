# 🎧 Audidex: Audio Deepfake Detection System

Audidex is an intelligent Audio Deepfake Detection System that leverages deep learning and hybrid glottal–spectral analysis to detect and classify synthetic or manipulated audio in real time. It combines Mel-spectrogram and glottal waveform features to deliver accurate, explainable, and scalable detection of deepfake speech.

## 📘 Overview

AI-generated voices and speech synthesis pose a growing threat to information authenticity. From voice-cloning scams to misinformation and impersonation, malicious audio can deceive both humans and machines.

Audidex addresses this with a hybrid feature pipeline and a deep neural model to differentiate genuine from fake audio. It emphasizes real-time processing and interpretability through visualizations (Mel-spectrogram and glottal waveform) and feature readouts (jitter, shimmer, HNR, formants).

## 🚀 Key Features
- **Real-Time Deepfake Detection**: Identify manipulated or synthetic audio streams instantly.
- **Hybrid Feature Extraction**: Mel-spectrogram + glottal features (jitter, shimmer, formants, HNR).
- **Robust Neural Architecture**: Fully Connected Neural Network (FCNN) trained on diverse data.
- **Explainable Results**: Spectrogram and glottal waveform visualizations for interpretability.
- **FastAPI Backend**: High-performance API with CORS and async processing.
- **Interactive React Frontend**: Upload/record audio and visualize predictions in real time.

## 🧩 System Architecture

### 1) High-Level Workflow
1. **Audio Input**: Upload a file or record live audio.
2. **Preprocessing**: Normalization, resampling to 16 kHz.
3. **Feature Extraction**:
   - Mel-spectrogram (frequency–time analysis)
   - Glottal features: jitter, shimmer, formants, HNR
4. **Model Inference**: FCNN classifies each sample/chunk as Real or Fake.
5. **Visualization**: Generates spectrogram + glottal waveform images and confidence.
6. **Output**: JSON report with prediction, confidence, plots, and feature values.

### 2) Tech Stack
- **Backend**: Python, FastAPI, TensorFlow/Keras, Librosa, NumPy/SciPy, Matplotlib
- **Frontend**: React.js (CRA), Tailwind CSS
- **Deployment**: Uvicorn, Docker (optional)

## 🧠 Methodology

### Feature Extraction
- **Glottal Features**: Captures micro-variations in vocal fold vibration (jitter, shimmer, HNR) and resonance (formants) for naturalness cues.
- **Mel-Spectrogram**: Perceptual frequency transformation for robust spectral patterns.
- Features are concatenated into one vector and normalized (scaler) before inference.

### Model Architecture: FCNN
- **Input**: Flattened vector of spectral + glottal features
- **Hidden**: Dense (512 → 256 → 128) with ReLU, BatchNorm, L2 regularization
- **Dropout**: 0.4, 0.3
- **Output**: Softmax → [Real, Fake]
- **Optimizer**: Adam (lr=1e-3)
- **Loss**: Categorical Cross-Entropy
- **Reported Performance**:
  - Training: 90.42%
  - Validation: 87.88%
  - Test: 87.50%

## 📂 Project Structure

```
Audidex/
├─ backend/
│  ├─ main.py                  # FastAPI app (predict endpoint, orchestration)
│  ├─ audio_processing.py      # Librosa-based spectral + glottal extraction
│  ├─ utils.py                 # Plot generation utilities
│  ├─ config.py                # Model/scaler loading; constants (SAMPLE_RATE, etc.)
│  ├─ prediction.py            # Chunk prediction helper (optional usage)
│  ├─ requirements.txt         # Backend dependencies (Python 3.12 compatible)
│  ├─ optimized_audio_deepfake_detector.h5
│  ├─ scaler.pkl
│  └─ temp/                    # Temporary audio assets
│
├─ frontend/
│  ├─ package.json             # React app config
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ Home.js
│  │  │  ├─ Home.css          # Styles (renamed from Home,css)
│  │  │  ├─ RealTime.js
│  │  │  ├─ RealTime.css
│  │  │  ├─ Upload.js
│  │  │  ├─ Report.js
│  │  │  └─ utils.js
│  │  ├─ App.js, App.css, index.js, etc.
│  └─ public/
│
└─ README.md
```

## 📦 Models

The pre-trained model (`optimized_audio_deepfake_detector.h5`) and scaler (`scaler.pkl`) are not included in this repository due to their size. You can download them from Hugging Face:

- **Hugging Face**: [soorajsatheesan/audidex](https://huggingface.co/soorajsatheesan/audidex)

Place the downloaded files in the `backend/` directory before running the application.

## ⚙️ Setup & Run

### 1) Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables (optional): not required; model/scaler paths are read from `config.py`.

### 2) Frontend
```bash
cd frontend
npm install
npm start
```

Configure the frontend to call the backend at `http://127.0.0.1:8000` (already used in `RealTime.js`).

## 📡 API

### POST `/predict`
- **Form**: `file` (binary audio; .wav/.webm, etc.)
- **Response**:
```json
{
  "prediction": "Real" | "Fake",
  "confidence": [[p_real, p_fake]],
  "mel_spectrogram": "<base64-png>",
  "glottal_waveform": "<base64-png>",
  "glottal_features": {
    "jitter": number,
    "shimmer": number,
    "hnr": number,
    "formants": [f1, f2, f3]
  }
}
```

## 🔒 Production Hardening Checklist
- **Config isolation**: keep constants and model paths in `config.py`; consider env vars for multi-env deployments.
- **Validation**: verify file type/size; limit duration; sanitize inputs; robust exception mapping.
- **Security**: restrict CORS in production; rate limit; enable HTTPS/HTTP2 at ingress; audit dependencies.
- **Observability**: structured logs, request IDs, basic metrics; health/readiness probes.
- **Performance**: warm model on startup; thread workers; batch or queue for heavy workloads.
- **Scalability**: containerize; set CPU/Memory requests/limits; autoscale; use GPU build if needed.
- **Storage**: avoid persisting temp files; use tmpfs or cloud object storage for uploads.

## 🗂 File-wise Explanation

### Backend
- `backend/main.py`: FastAPI app with CORS, POST `/predict`, orchestrates feature extraction and inference. Fixes `__main__` guard, returns plots and features.
- `backend/audio_processing.py`: Implements `extract_spectral_features`, `extract_glottal_features`, `extract_formants`, and `load_audio` using Librosa, SciPy, and NumPy.
- `backend/utils.py`: `generate_plot` utility that renders an image to a temp file and returns base64.
- `backend/config.py`: Loads TensorFlow model (`optimized_audio_deepfake_detector.h5`) and `scaler.pkl`, defines `SAMPLE_RATE`, `N_MELS`, `IMG_WIDTH`.
- `backend/prediction.py`: Helper for per-chunk predictions using the shared scaler/model.
- `backend/requirements.txt`: Pinned versions compatible with Python 3.12 and TensorFlow 2.16.1.

### Frontend
- `frontend/src/components/Home.js`: Landing page with CTAs and feedback form.
- `frontend/src/components/Home.css`: Wave animation styles used by Home.
- `frontend/src/components/RealTime.js`: Microphone capture, sends audio to backend, renders predictions and plots.
- `frontend/src/components/Upload.js`: Upload audio file and view results.
- `frontend/src/components/Report.js`: Display report details.
- `frontend/src/components/RealTime.css`, `UploadPage.css`: Component styles.
- `frontend/src/components/utils.js`: Helper utilities for the frontend.

## 🧪 Testing
- Unit tests should be placed under `tests/units/` and integration tests under `tests/integration/`.
- Suggested tests:
  - Feature extraction shape and value ranges
  - Model input padding/truncation
  - `/predict` endpoint happy-path and error handling

## 📄 License

This project is licensed under the **MIT License**. You are free to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of this software, subject to
the inclusion of the copyright notice and permission notice.

- **Permitted**: commercial use, modification, distribution, private use
- **Limitations**: no liability, no warranty

See the full license text in [`LICENSE`](./LICENSE).
