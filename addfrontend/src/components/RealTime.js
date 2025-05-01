import React, { useState, useRef } from "react";
import { ClipLoader } from "react-spinners";

const AudioProcessor = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [melSpectrogram, setMelSpectrogram] = useState("");
  const [glottalWaveform, setGlottalWaveform] = useState("");
  const [glottalFeatures, setGlottalFeatures] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        sendAudioToBackend(audioBlob);
      };
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setIsLoading(true);
    setMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", audioBlob, "recorded_audio.webm");

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to process audio.");
      }

      setMessage("Audio sent successfully! Processing results...");
      setResult(responseData.prediction);
      setMelSpectrogram(responseData.mel_spectrogram);
      setGlottalWaveform(responseData.glottal_waveform);
      setGlottalFeatures(responseData.glottal_features);
    } catch (err) {
      console.error("Error:", err);
      setError("Error processing audio. Please try again.");
    }

    setIsLoading(false);
  };

  // Determine the background gradient based on the result
  const getBackgroundClass = () => {
    if (result === "Real") {
      return "bg-gradient-to-br from-green-400 via-green-500 to-green-600";
    } else if (result === "Fake") {
      return "bg-gradient-to-br from-red-400 via-red-500 to-red-600";
    }
    return "bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-700";
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${getBackgroundClass()} p-6`}
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          Audio Deepfake Detection
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Record your audio and detect if it is genuine or a deepfake.
        </p>

        {/* Recording Controls */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-8 py-4 rounded-full font-semibold text-white text-lg transition-all duration-300 ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 hover:scale-105 shadow-lg"
                : "bg-green-500 hover:bg-green-600 hover:scale-105 shadow-lg"
            }`}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          {/* Recording Animation */}
          {isRecording && (
            <div className="mt-6">
              <div className="w-16 h-16 bg-red-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Recorded Audio:
            </h3>
            <audio controls src={audioUrl} className="mt-2"></audio>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center mb-6">
            <ClipLoader color="#3490dc" loading={isLoading} size={50} />
          </div>
        )}

        {/* Message */}
        {message && <div className="text-center text-green-600">{message}</div>}

        {/* Error */}
        {error && <div className="text-center text-red-600">{error}</div>}

        {/* Result */}
        {!isLoading && result && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">
              Prediction: {result}
            </h2>

            {/* Mel-Spectrogram */}
            {melSpectrogram && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Mel-Spectrogram:
                </h3>
                <img
                  src={`data:image/png;base64,${melSpectrogram}`}
                  alt="Mel-Spectrogram"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Glottal Waveform */}
            {glottalWaveform && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Glottal Waveform:
                </h3>
                <img
                  src={`data:image/png;base64,${glottalWaveform}`}
                  alt="Glottal Waveform"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Glottal Features */}
            {glottalFeatures && (
              <div className="mt-4 text-left">
                <h3 className="text-lg font-bold text-gray-800">
                  Glottal Features:
                </h3>
                <ul className="list-disc ml-6 text-gray-600">
                  <li>Jitter: {glottalFeatures.jitter.toFixed(4)}</li>
                  <li>Shimmer: {glottalFeatures.shimmer.toFixed(4)}</li>
                  <li>HNR: {glottalFeatures.hnr.toFixed(4)}</li>
                  <li>
                    Formants:{" "}
                    {glottalFeatures.formants.map((f, i) => (
                      <span key={i} className="ml-2">
                        {f.toFixed(2)} Hz{", "}
                      </span>
                    ))}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioProcessor;
