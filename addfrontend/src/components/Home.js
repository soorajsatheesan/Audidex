import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineCheckCircle } from "react-icons/ai";

const Home = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", thoughts: "" });

  // Regex patterns for validation
  const nameRegex = /^[a-zA-Z ]{2,30}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = () => {
    const newErrors = { name: "", email: "", thoughts: "" };

    if (!nameRegex.test(name)) {
      newErrors.name =
        "Please enter a valid name (letters only, 2-30 characters).";
    }
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!thoughts.trim()) {
      newErrors.thoughts = "Feedback cannot be empty.";
    }

    setErrors(newErrors);

    // Return true if no errors
    return !newErrors.name && !newErrors.email && !newErrors.thoughts;
  };

  const sendThoughts = () => {
    if (!validateForm()) return;

    const mailtoLink = `mailto:soorajsatheesan4321@gmail.com?subject=Feedback from ${name}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nFeedback:\n${thoughts}`
    )}`;
    window.location.href = mailtoLink;

    setFeedbackSent(true);

    setTimeout(() => {
      setName("");
      setEmail("");
      setThoughts("");
      setFeedbackSent(false);
      setErrors({ name: "", email: "", thoughts: "" });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white">
      <header className="py-8 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold">Audio Deepfake Detection</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <button
                  onClick={() => navigate("/realtime")}
                  className="text-lg font-medium hover:underline"
                >
                  Real-Time Detection
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/upload")}
                  className="text-lg font-medium hover:underline"
                >
                  Upload Detection
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center py-16 px-6">
          <h2 className="text-5xl font-bold mb-6">
            Detect Audio Deepfakes Instantly
          </h2>
          <p className="text-lg mb-8 max-w-3xl">
            Use cutting-edge technology to analyze audio for signs of deepfake
            manipulation. Upload a file or try our real-time detection to
            identify fake audio in seconds.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/realtime")}
              className="px-8 py-3 bg-green-500 rounded-lg font-semibold hover:bg-green-600 transition duration-300"
            >
              Try Real-Time Detection
            </button>
            <button
              onClick={() => navigate("/upload")}
              className="px-8 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Upload Audio
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white text-gray-800 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">
              Why Choose Our Audio Deepfake Detector?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-gray-100 rounded-lg shadow">
                <h4 className="text-xl font-bold mb-4">Mel Spectrogram</h4>
                <p>
                  Visual representation of audio frequencies over time. It
                  allows our AI to identify subtle changes that are indicative
                  of deepfake audio manipulations.
                </p>
              </div>
              <div className="p-6 bg-gray-100 rounded-lg shadow">
                <h4 className="text-xl font-bold mb-4">
                  Glottal-Based Analysis
                </h4>
                <p>
                  Uses features like jitter, shimmer, and harmonics-to-noise
                  ratio (HNR) to detect irregularities in voice production,
                  crucial for identifying synthetic audio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Send Your Thoughts Section */}
        <section className="bg-gradient-to-br from-purple-600 to-indigo-700 py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">Send Your Thoughts</h3>
            <p className="text-lg mb-8">
              We'd love to hear your feedback or suggestions!
            </p>

            {feedbackSent ? (
              <div className="text-center text-green-500">
                <AiOutlineCheckCircle size={50} className="mx-auto mb-4" />
                <p className="text-xl font-semibold">Feedback Sent!</p>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 rounded-lg text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2">{errors.name}</p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 rounded-lg text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                  )}
                </div>
                <div>
                  <textarea
                    className="w-full p-4 rounded-lg text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Write your feedback here..."
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    rows="4"
                  ></textarea>
                  {errors.thoughts && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.thoughts}
                    </p>
                  )}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={sendThoughts}
                    className="px-8 py-3 bg-green-500 rounded-lg font-semibold text-white hover:bg-green-600 transition duration-300"
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Audio Deepfake Detection. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
