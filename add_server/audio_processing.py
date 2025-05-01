import numpy as np
import librosa
from scipy.signal import correlate
from scipy.linalg import toeplitz, solve
from config import SAMPLE_RATE, N_MELS, IMG_WIDTH


def extract_formants(audio, sr):
    pre_emphasis = 0.97
    emphasized_audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
    lpc_order = 16
    r = correlate(emphasized_audio, emphasized_audio, mode="full")
    r = r[len(r) // 2 :]
    R = toeplitz(r[:lpc_order])
    rhs = r[1 : lpc_order + 1]
    lpc_coeffs = np.concatenate(([1], solve(R, rhs)))
    roots = [r for r in np.roots(lpc_coeffs) if np.imag(r) >= 0]
    angles = np.angle(roots)
    freqs = angles * (sr / (2 * np.pi))
    return np.array(sorted(freqs)[:3])


def extract_glottal_features(audio, sr):
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


def load_audio(file_path):
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)
    return audio, sr
