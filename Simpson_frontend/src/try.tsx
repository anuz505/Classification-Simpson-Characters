// SimpsonsClassifier.tsx
import React, { useState, useRef, ChangeEvent } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

// Define types based on your Flask API
interface PredictionResult {
  character: string;
  confidence: number;
}

// Map for better character display names (converting snake_case to proper names)
const characterDisplayNames: Record<string, string> = {
  homer_simpson: "Homer Simpson",
  ned_flanders: "Ned Flanders",
  moe_szyslak: "Moe Szyslak",
  lisa_simpson: "Lisa Simpson",
  bart_simpson: "Bart Simpson",
  marge_simpson: "Marge Simpson",
  krusty_the_clown: "Krusty the Clown",
  principal_skinner: "Principal Skinner",
  charles_montgomery_burns: "Mr. Burns",
  milhouse_van_houten: "Milhouse Van Houten",
};

const SimpsonsClassifier: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File): void => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      setError("Please upload an image file");
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setError(null);
  };

  const formatCharacterName = (character: string): string => {
    return (
      characterDisplayNames[character] ||
      character
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const classifyImage = async (): Promise<void> => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create FormData to send the image file
      const formData = new FormData();
      formData.append("file", file);

      // Make request to Flask API
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = (await response.json()) as PredictionResult;
      setPrediction({
        character: data.character,
        confidence: data.confidence,
      });
    } catch (err) {
      console.error("Error classifying image:", err);
      setError(
        "Failed to classify image. Please try again or check if the server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = (): void => {
    setFile(null);
    setPreview(null);
    setPrediction(null);
    setError(null);
  };

  const getConfidenceColorClass = (confidence: number): string => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col items-center p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-500 mb-2">
          Simpson Character Classifier
        </h1>
        <p className="text-gray-600">
          Drag and drop an image to identify Simpson characters
        </p>
      </div>

      {!file ? (
        <div
          className={`w-full p-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? "border-yellow-500 bg-yellow-50"
              : "border-gray-300 hover:border-yellow-500 hover:bg-yellow-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="text-yellow-500 mb-4" />
          <p className="text-lg mb-2 font-medium">
            Drag & Drop your image here
          </p>
          <p className="text-gray-500 mb-4">or click to browse files</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col md:flex-row gap-8 mb-6">
            <div className="flex-1 flex flex-col items-center">
              <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 shadow-md mb-4">
                <img
                  src={preview ?? ""}
                  alt="Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
              <button
                onClick={resetState}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Upload a different image
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  {error}
                </div>
              )}

              {!prediction && !isLoading && !error && (
                <button
                  onClick={classifyImage}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow transition-colors w-full md:w-auto"
                >
                  Classify Character
                </button>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
                  <p className="text-gray-600">Analyzing image...</p>
                </div>
              )}

              {prediction && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle size={24} className="text-green-500 mr-2" />
                    <h3 className="text-xl font-bold">Classification Result</h3>
                  </div>

                  <div className="mb-6">
                    <div className="text-gray-600 mb-1 text-sm">CHARACTER</div>
                    <div className="text-2xl font-bold">
                      {formatCharacterName(prediction.character)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-600 mb-1 text-sm">CONFIDENCE</div>
                    <div
                      className={`text-2xl font-bold ${getConfidenceColorClass(
                        prediction.confidence
                      )}`}
                    >
                      {(prediction.confidence * 100).toFixed(2)}%
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className={`h-2.5 rounded-full ${
                          prediction.confidence >= 0.9
                            ? "bg-green-500"
                            : prediction.confidence >= 0.7
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={classifyImage}
                    className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Analyze Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpsonsClassifier;
