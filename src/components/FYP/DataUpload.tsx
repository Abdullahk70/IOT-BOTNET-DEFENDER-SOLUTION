import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiInfo,
} from "react-icons/fi";

const DataUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setMessage("");
        setStatus("idle");
      }
    }
  };

  const validateFile = (file: File) => {
    // Check for CSV file
    if (!file.name.endsWith(".csv")) {
      setStatus("error");
      setMessage("Please upload a CSV file");
      return false;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setStatus("error");
      setMessage("File size exceeds 50MB limit");
      return false;
    }

    return true;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setMessage("");
      setStatus("idle");
    }
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file first");
      setStatus("error");
      return;
    }

    setIsUploading(true);
    setMessage("Uploading file...");
    setStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Add a delay to simulate network latency for testing UI
      // Remove this in production
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await axios.post(
        "http://localhost:5000/ml/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Store dataset ID in localStorage for other components to use
        if (response.data.datasetId) {
          localStorage.setItem("currentDatasetId", response.data.datasetId);
          console.log("Dataset ID saved:", response.data.datasetId);
        }

        setStatus("success");
        setMessage(
          "File uploaded successfully! The data is now stored in the database and will be used for processing."
        );
      } else {
        setStatus("error");
        setMessage("Failed to upload file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      setMessage("An error occurred while uploading the file.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setMessage("");
    setStatus("idle");
  };

  const fileSize = file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "";

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-all duration-300"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
        backdropFilter: "blur(20px)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FiUploadCloud className="mr-2 text-indigo-500" /> Data Upload
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Start your data preprocessing journey by uploading a CSV dataset.
        </p>
      </div>

      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 text-center min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden
            ${
              isDragging
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.01] shadow-lg"
                : "border-gray-300 dark:border-gray-700 hover:border-indigo-500 hover:shadow-md"
            }
            ${
              status === "success"
                ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                : ""
            }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
          />

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                className="flex flex-col items-center justify-center w-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-green-500 mb-4">
                  <FiCheckCircle size={48} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Upload Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {file?.name}
                </p>
                <button
                  className="mt-2 px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors"
                  onClick={resetForm}
                >
                  Upload Another File
                </button>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-indigo-500 mb-4">
                  <FiUploadCloud size={48} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {file ? "File Selected" : "Drop your CSV file here"}
                </h3>
                {file ? (
                  <div className="w-full max-w-sm">
                    <div className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                      <FiFileText className="text-indigo-500 mr-3 text-2xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-gray-800 dark:text-white truncate">
                          {file.name}
                        </span>
                        <span className="block text-gray-500 dark:text-gray-400 text-sm">
                          {fileSize}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-sm text-gray-500 hover:text-indigo-500 mt-2"
                      onClick={resetForm}
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    or{" "}
                    <label
                      htmlFor="file-upload"
                      className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      browse files
                    </label>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {status !== "success" && (
          <motion.button
            type="button"
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
                      ${
                        isUploading
                          ? "bg-indigo-600/80"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } 
                      ${
                        !file
                          ? "opacity-60 cursor-not-allowed"
                          : "shadow-md hover:shadow-lg"
                      }`}
            disabled={isUploading || !file}
            whileHover={{ scale: isUploading || !file ? 1 : 1.02 }}
            whileTap={{ scale: isUploading || !file ? 1 : 0.98 }}
            onClick={handleUpload}
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              "Upload Dataset"
            )}
          </motion.button>
        )}

        <AnimatePresence>
          {message && status !== "success" && (
            <motion.div
              className={`flex items-center justify-center rounded-lg p-3 mt-4 text-center
                ${
                  status === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {status === "error" ? (
                <FiAlertCircle className="mr-2 flex-shrink-0" />
              ) : (
                <FiInfo className="mr-2 flex-shrink-0" />
              )}
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
            Before You Upload
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
              <div className="text-indigo-500 mb-3">
                <FiFileText className="text-xl" />
              </div>
              <h4 className="text-base font-medium mb-2 text-gray-800 dark:text-gray-100">
                File Format
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Upload data in CSV (Comma Separated Values) format only
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
              <div className="text-indigo-500 mb-3">
                <FiInfo className="text-xl" />
              </div>
              <h4 className="text-base font-medium mb-2 text-gray-800 dark:text-gray-100">
                Requirements
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Ensure your CSV has headers and contains at least 10 rows
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
              <div className="text-indigo-500 mb-3">
                <FiAlertCircle className="text-xl" />
              </div>
              <h4 className="text-base font-medium mb-2 text-gray-800 dark:text-gray-100">
                Limitations
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Maximum file size: 50MB. Larger files may require preprocessing
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataUpload;
