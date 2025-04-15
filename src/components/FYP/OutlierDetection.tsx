import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Plot from "react-plotly.js";
import {
  FiSearch,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiSettings,
  FiPieChart,
  FiAlertTriangle,
} from "react-icons/fi";

const OutlierDetection: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [method, setMethod] = useState<string>("isolation_forest");
  const [threshold, setThreshold] = useState<number>(0.5);
  const [contamination, setContamination] = useState<number>(0.05);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<any | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const methods = [
    {
      id: "isolation-forest",
      name: "Isolation Forest",
      description:
        "Isolates outliers by recursively partitioning the data using random split values.",
    },
    {
      id: "local-outlier-factor",
      name: "Local Outlier Factor (LOF)",
      description:
        "Computes the local density deviation of a data point with respect to its neighbors.",
    },
    {
      id: "one-class-svm",
      name: "One-Class SVM",
      description:
        "A support vector machine that learns a decision boundary around normal data points.",
    },
    {
      id: "dbscan",
      name: "DBSCAN",
      description:
        "Density-based clustering algorithm that groups points in high-density regions.",
    },
  ];

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setCsvFile(file);

    // Prepare form data for file upload
    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("uploading");
    setUploadMessage("Uploading file...");

    try {
      // Upload file to server
      const response = await axios.post(
        "http://localhost:5000/ml/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setUploadStatus("success");
        setUploadMessage("File uploaded successfully!");
        setUploadedFilePath(response.data.file.path);

        // Now fetch the columns using getLastDataset endpoint instead of ml/columns
        try {
          const columnsResponse = await axios.get(
            "http://localhost:5000/ml/retrieve"
          );

          if (columnsResponse.data) {
            // Check if we have headers or dataset with keys
            let columnNames = [];
            if (
              Array.isArray(columnsResponse.data) &&
              columnsResponse.data.length > 0
            ) {
              // Case 1: Data is an array of objects
              columnNames = Object.keys(columnsResponse.data[0] || {});
            } else if (columnsResponse.data.headers) {
              // Case 2: Data has headers property
              columnNames = columnsResponse.data.headers;
            }

            setColumns(columnNames);
            // Select all columns by default
            setSelectedColumns(columnNames);
          }
        } catch (columnError) {
          console.error("Error fetching columns:", columnError);
          // Try alternative endpoint
          try {
            const lastDatasetResponse = await axios.get(
              "http://localhost:5000/ml/export"
            );

            if (lastDatasetResponse.data && lastDatasetResponse.data.headers) {
              setColumns(lastDatasetResponse.data.headers);
              setSelectedColumns(lastDatasetResponse.data.headers);
            }
          } catch (alternativeError) {
            console.error(
              "Error fetching from alternative endpoint:",
              alternativeError
            );
            // Use mock data as fallback
            const mockColumns = [
              "Column1",
              "Column2",
              "Column3",
              "Column4",
              "Column5",
            ];
            setColumns(mockColumns);
            setSelectedColumns(mockColumns);
          }
        }
      } else {
        setUploadStatus("error");
        setUploadMessage(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadMessage("Error uploading file. Please try again.");

      // Fallback to mock data for demonstration purposes
      setTimeout(() => {
        const mockColumns = [
          "Column1",
          "Column2",
          "Column3",
          "Column4",
          "Column5",
        ];
        setColumns(mockColumns);
        setSelectedColumns(mockColumns);
        setUploadStatus("success");
        setUploadMessage("Using mock data for demonstration");
      }, 1000);
    }
  };

  // Handle column selection
  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((col) => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Handle select all columns
  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...columns]);
    }
  };

  // Handle detection method change
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMethod(e.target.value);
  };

  // Handle threshold change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseFloat(e.target.value));
  };

  // Handle contamination change
  const handleContaminationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContamination(parseFloat(e.target.value));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!uploadedFilePath) {
      setUploadStatus("error");
      setUploadMessage("Please upload a CSV file first");
      return;
    }

    if (selectedColumns.length === 0) {
      setUploadStatus("error");
      setUploadMessage("Please select at least one column");
      return;
    }

    setIsProcessing(true);

    // For demo purposes, generate mock results
    try {
      // Mock API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate random outlier indices
      const rowCount = Math.floor(Math.random() * 1000) + 100;
      const outlierIndices = Array.from(
        { length: Math.floor(rowCount * contamination) },
        () => Math.floor(Math.random() * rowCount)
      );

      // Generate mock outlier scores
      const outlierScores = Array.from({ length: 10 }, () => ({
        index: Math.floor(Math.random() * rowCount),
        score: Math.random() * 0.9 + 0.1,
      })).sort((a, b) => b.score - a.score);

      const mockResults = {
        method,
        threshold,
        contamination,
        total_points: rowCount,
        outliers_found: outlierIndices.length,
        outlier_indices: outlierIndices,
        top_outliers: outlierScores,
        columns_analyzed: selectedColumns,
        processing_time: (Math.random() * 2 + 0.5).toFixed(2),
      };

      setResults(mockResults);
      setIsProcessing(false);
    } catch (error) {
      console.error("Processing error:", error);
      setIsProcessing(false);
      setUploadStatus("error");
      setUploadMessage("Error processing data. Please try again.");
    }
  };

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
          <FiSearch className="mr-2 text-indigo-500" /> Outlier Detection
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Identify and analyze outliers in your dataset using various detection
          algorithms.
        </p>
      </div>

      <div className="space-y-8">
        {/* File Upload Section */}
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiUpload className="mr-2 text-indigo-500" /> Upload Dataset
          </h3>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-indigo-500 mb-2">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                {csvFile
                  ? csvFile.name
                  : "Drag & drop your CSV file or click to browse"}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Supported format: CSV (up to 50MB)
              </span>
            </label>
          </div>

          {uploadStatus !== "idle" && (
            <div
              className={`mt-4 px-4 py-3 rounded-lg flex items-center ${
                uploadStatus === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : uploadStatus === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
              }`}
            >
              {uploadStatus === "error" ? (
                <FiAlertCircle className="mr-2 flex-shrink-0" />
              ) : uploadStatus === "success" ? (
                <FiCheckCircle className="mr-2 flex-shrink-0" />
              ) : (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
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
              )}
              {uploadMessage}
            </div>
          )}
        </div>

        {/* Detection Settings */}
        {columns.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <FiSettings className="mr-2 text-indigo-500" /> Detection Settings
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Detection Algorithm
                </label>
                <select
                  value={method}
                  onChange={handleMethodChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {methods.find((m) => m.id === method)?.description}
                </p>
              </div>

              {/* Threshold & Contamination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <span>Detection Threshold</span>
                    <span>{threshold.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={threshold}
                    onChange={handleThresholdChange}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Higher values detect more extreme outliers only.
                  </p>
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <span>Expected Contamination</span>
                    <span>{contamination.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={contamination}
                    onChange={handleContaminationChange}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Estimated percentage of outliers in your dataset.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
                          ${
                            isProcessing
                              ? "bg-indigo-600/80"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          } 
                          ${
                            selectedColumns.length === 0
                              ? "opacity-60 cursor-not-allowed"
                              : "shadow-md hover:shadow-lg"
                          }`}
                disabled={isProcessing || selectedColumns.length === 0}
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              >
                {isProcessing ? (
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
                    Processing...
                  </>
                ) : (
                  "Detect Outliers"
                )}
              </motion.button>
            </form>
          </div>
        )}

        {/* Column Selection */}
        {columns.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FiBarChart2 className="mr-2 text-indigo-500" /> Select Features
              </h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
              >
                {selectedColumns.length === columns.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columns.map((column) => (
                <div
                  key={column}
                  className={`relative flex items-center p-3 rounded-md cursor-pointer transition-all border
                    ${
                      selectedColumns.includes(column)
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  onClick={() => handleColumnToggle(column)}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {column}
                  </label>
                </div>
              ))}
            </div>

            {columns.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No columns found. Please upload a valid CSV file.
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {results && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Outlier Detection Results
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Method: {methods.find((m) => m.id === results.method)?.name} |
                Processing Time: {results.processing_time}s
              </p>
            </div>

            <div className="p-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <div className="text-indigo-800 dark:text-indigo-300 font-semibold mb-1">
                    Total Points
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {results.total_points.toLocaleString()}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                  <div className="text-amber-800 dark:text-amber-300 font-semibold mb-1">
                    Outliers Found
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {results.outliers_found.toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
                  <div className="text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                    Outlier Percentage
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {(
                      (results.outliers_found / results.total_points) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>

              {/* Top Outliers */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Top Outliers
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Row Index
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Anomaly Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {results.top_outliers.map((outlier: any, idx: number) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50 dark:bg-gray-800/50"
                          }
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {outlier.index}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <div className="mr-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className="bg-red-500 h-2.5 rounded-full"
                                  style={{ width: `${outlier.score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">
                                {outlier.score.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                outlier.score > 0.8
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : outlier.score > 0.6
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              }`}
                            >
                              {outlier.score > 0.8
                                ? "High"
                                : outlier.score > 0.6
                                ? "Medium"
                                : "Low"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visualization Placeholder */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Outlier Distribution
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 h-80 flex items-center justify-center">
                  {/* In a real implementation, add a proper visualization here */}
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-16 h-16 mx-auto mb-3 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      ></path>
                    </svg>
                    <p>
                      Visualization would appear here in the full implementation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default OutlierDetection;
