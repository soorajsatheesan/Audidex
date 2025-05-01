import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Report = ({
  fileName,
  duration,
  prediction,
  melSpectrogram,
  glottalWaveform,
  glottalFeatures,
}) => {
  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    try {
      // Header Section
      const header = document.getElementById("report-header");
      const headerCanvas = await html2canvas(header, { scale: 2 });
      const headerImage = headerCanvas.toDataURL("image/png");
      pdf.addImage(headerImage, "PNG", 10, 10, pageWidth - 20, 30);

      // Prediction Section
      const predictionSection = document.getElementById("report-prediction");
      const predictionCanvas = await html2canvas(predictionSection, {
        scale: 2,
      });
      const predictionImage = predictionCanvas.toDataURL("image/png");
      pdf.addImage(predictionImage, "PNG", 10, 50, pageWidth - 20, 30);

      // Mel Spectrogram Section
      if (melSpectrogram) {
        const melSection = document.getElementById("report-mel");
        const melCanvas = await html2canvas(melSection, { scale: 2 });
        const melImage = melCanvas.toDataURL("image/png");
        pdf.addImage(melImage, "PNG", 10, 90, pageWidth - 20, 60);
      }

      // Glottal Waveform Section
      if (glottalWaveform) {
        const glottalSection = document.getElementById("report-glottal");
        const glottalCanvas = await html2canvas(glottalSection, { scale: 2 });
        const glottalImage = glottalCanvas.toDataURL("image/png");
        pdf.addPage();
        pdf.addImage(glottalImage, "PNG", 10, 10, pageWidth - 20, 60);
      }

      // Glottal Features Section
      if (glottalFeatures) {
        const featuresSection = document.getElementById("report-features");
        const featuresCanvas = await html2canvas(featuresSection, { scale: 2 });
        const featuresImage = featuresCanvas.toDataURL("image/png");
        pdf.addPage();
        pdf.addImage(featuresImage, "PNG", 10, 10, pageWidth - 20, 60);
      }

      // Footer with Date and Time
      const date = new Date();
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${date.toLocaleString()}`, 10, pageHeight - 10);

      pdf.save("Audio_Deepfake_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the report. Please try again.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
      {/* Button to generate PDF */}
      <div className="text-center mb-4">
        <button
          onClick={generatePDF}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-300"
        >
          Download PDF Report
        </button>
      </div>

      {/* Report Content */}
      <div
        id="report-header"
        className="bg-white p-6 border border-gray-300 rounded-lg mb-4"
      >
        <h1 className="text-4xl font-bold text-center mb-2">
          Audio Deepfake Detection Report
        </h1>
        <p className="text-lg text-center text-gray-700">
          File: {fileName || "Unknown"}
        </p>
        <p className="text-lg text-center text-gray-700">
          Duration: {duration || "Unknown"} seconds
        </p>
      </div>

      <div
        id="report-prediction"
        className="bg-white p-4 border border-gray-300 rounded-lg mb-4"
      >
        <h2 className="text-2xl font-semibold text-gray-800">Prediction</h2>
        <p className="text-lg text-gray-700">{prediction || "Unknown"}</p>
      </div>

      {melSpectrogram && (
        <div
          id="report-mel"
          className="bg-white p-4 border border-gray-300 rounded-lg mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Mel Spectrogram
          </h2>
          <img
            src={`data:image/png;base64,${melSpectrogram}`}
            alt="Mel Spectrogram"
            className="w-full mt-4 border border-gray-300"
          />
        </div>
      )}

      {glottalWaveform && (
        <div
          id="report-glottal"
          className="bg-white p-4 border border-gray-300 rounded-lg mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Glottal Waveform
          </h2>
          <img
            src={`data:image/png;base64,${glottalWaveform}`}
            alt="Glottal Waveform"
            className="w-full mt-4 border border-gray-300"
          />
        </div>
      )}

      {glottalFeatures && (
        <div
          id="report-features"
          className="bg-white p-4 border border-gray-300 rounded-lg mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Glottal Features
          </h2>
          <ul className="list-disc pl-6 text-gray-800">
            <li>Jitter: {glottalFeatures.jitter.toFixed(4)}</li>
            <li>Shimmer: {glottalFeatures.shimmer.toFixed(4)}</li>
            <li>HNR: {glottalFeatures.hnr.toFixed(4)}</li>
            <li>
              Formants:{" "}
              {glottalFeatures.formants.map((f, i) => (
                <span key={i} className="mr-2">
                  {f.toFixed(2)} Hz,
                </span>
              ))}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Report;
