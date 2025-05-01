import React, { useState, useRef } from "react";
import { ClipLoader } from "react-spinners";
import { jsPDF } from "jspdf";
import "./UploadPage.css";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [melSpectrogram, setMelSpectrogram] = useState("");
  const [glottalWaveform, setGlottalWaveform] = useState("");
  const [glottalFeatures, setGlottalFeatures] = useState(null);
  const [error, setError] = useState(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const audioRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }

    setError(null);
    setResult(null);
    setMelSpectrogram("");
    setGlottalWaveform("");
    setGlottalFeatures(null);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration.toFixed(2));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an audio file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to process audio.");
      }

      setResult(responseData.prediction);
      setMelSpectrogram(responseData.mel_spectrogram);
      setGlottalWaveform(responseData.glottal_waveform);
      setGlottalFeatures(responseData.glottal_features);
    } catch (err) {
      console.error("Error:", err);
      setError("Error detecting audio. Please try again later.");
    }

    setIsLoading(false);
  };

  const handleDownload = () => {
    setIsDownloaded(false);

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFontSize(20);
    pdf.text("Audio Deepfake Detection Report", 10, 20);
    pdf.setFontSize(14);
    pdf.text(`File: ${file?.name || "Unknown"}`, 10, 30);
    pdf.text(`Duration: ${audioDuration || "Unknown"} seconds`, 10, 40);
    pdf.text(`Prediction: ${result || "Unknown"}`, 10, 50);

    if (melSpectrogram) {
      pdf.text("Mel-Spectrogram:", 10, 60);
      pdf.addImage(
        `data:image/png;base64,${melSpectrogram}`,
        "PNG",
        10,
        70,
        180,
        100
      );
    }

    if (glottalWaveform) {
      pdf.addPage();
      pdf.text("Glottal Waveform:", 10, 20);
      pdf.addImage(
        `data:image/png;base64,${glottalWaveform}`,
        "PNG",
        10,
        30,
        180,
        100
      );
    }

    if (glottalFeatures) {
      pdf.addPage();
      pdf.text("Glottal Features:", 10, 20);
      pdf.text(`Jitter: ${glottalFeatures.jitter.toFixed(4)}`, 10, 30);
      pdf.text(`Shimmer: ${glottalFeatures.shimmer.toFixed(4)}`, 10, 40);
      pdf.text(`HNR: ${glottalFeatures.hnr.toFixed(4)}`, 10, 50);
      pdf.text(
        `Formants: ${
          glottalFeatures.formants.map((f) => f.toFixed(2)).join(", ") || "N/A"
        }`,
        10,
        60
      );
    }

    pdf.save("Audio_Deepfake_Report.pdf");
    setIsDownloaded(true);
  };

  return (
    <div className="upload-page">
      <header className="header">
        <h1 className="header-title">Audio Deepfake Detection</h1>
        <button
          className="header-button"
          onClick={() => (window.location.href = "/realtime")}
        >
          Switch to Real-Time Detection
        </button>
      </header>
      <div className="upload-container">
        {/* Fixed Left Section */}
        <div className="upload-left">
          <h1 className="title">Upload Audio for Detection</h1>
          <p className="subtitle">
            Upload your audio file to detect whether it is genuine or a
            deepfake.
          </p>

          {/* File Input */}
          <div className="file-input-container">
            <label className="file-input-label">
              <input
                type="file"
                onChange={handleFileChange}
                accept="audio/mp3, audio/wav"
                className="file-input"
              />
              Choose File
            </label>
            <span className="file-chosen">
              {file?.name || "No file chosen"}
            </span>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="audio-container">
              <h3 className="audio-title">Uploaded Audio:</h3>
              <audio
                controls
                src={audioUrl}
                ref={audioRef}
                onLoadedMetadata={handleLoadedMetadata}
                className="audio-player"
              ></audio>
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className={`upload-button ${isLoading ? "button-disabled" : ""}`}
          >
            {isLoading ? "Uploading..." : "Upload and Detect"}
          </button>
        </div>

        {/* Scrollable Right Section */}
        <div className="upload-right">
          <h1 className="title">Results</h1>
          {isLoading && (
            <div className="text-center mt-4">
              <ClipLoader color="#4299e1" loading={isLoading} size={50} />
            </div>
          )}

          {result && (
            <>
              <h3 className="result-prediction">Prediction: {result}</h3>

              {melSpectrogram && (
                <div className="result-image">
                  <h3>Mel-Spectrogram:</h3>
                  <img
                    src={`data:image/png;base64,${melSpectrogram}`}
                    alt="Mel Spectrogram"
                  />
                </div>
              )}

              {glottalWaveform && (
                <div className="result-image">
                  <h3>Glottal Waveform:</h3>
                  <img
                    src={`data:image/png;base64,${glottalWaveform}`}
                    alt="Glottal Waveform"
                  />
                </div>
              )}

              {glottalFeatures && (
                <div className="glottal-features">
                  <h3>Glottal Features:</h3>
                  <ul>
                    <li>Jitter: {glottalFeatures.jitter.toFixed(4)}</li>
                    <li>Shimmer: {glottalFeatures.shimmer.toFixed(4)}</li>
                    <li>HNR: {glottalFeatures.hnr.toFixed(4)}</li>
                    <li>
                      Formants:{" "}
                      {glottalFeatures.formants.map((f, i) => (
                        <span key={i}>
                          {f.toFixed(2)} Hz{", "}
                        </span>
                      ))}
                    </li>
                  </ul>
                </div>
              )}

              <button onClick={handleDownload} className="download-button">
                Download Report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
