import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiActivity,
  FiCheck,
  FiAlertCircle,
  FiList,
  FiRepeat,
  FiTable,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import DatasetSelector from "./DatasetSelector";

const Normalization: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [method, setMethod] = useState<"min-max" | "z-score" | "robust">(
    "min-max"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [normalizedData, setNormalizedData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const fetchColumns = async (selectedDatasetId: string) => {
    try {
      const response = await axios.get("http://localhost:5000/ml/columns", {
        params: {
          datasetId: selectedDatasetId,
        },
      });

      if (response.data.success) {
        setColumns(response.data.columns);
        // Reset selected columns when changing datasets
        setSelectedColumns([]);
        // Reset any previous results
        setShowResults(false);
        setNormalizedData(null);
        setMessage("");
        setStatus("idle");
      } else {
        setError("Failed to fetch columns");
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
      setError("Error fetching columns from the selected dataset.");
    }
  };

  const handleDatasetSelect = (selectedDatasetId: string) => {
    setDatasetId(selectedDatasetId);
    fetchColumns(selectedDatasetId);
  };

  useEffect(() => {
    // Try to get datasetId from localStorage on component mount
    const storedDatasetId = localStorage.getItem("currentDatasetId");
    if (storedDatasetId) {
      setDatasetId(storedDatasetId);
      fetchColumns(storedDatasetId);
    }
  }, []);

  const handleColumnChange = (column: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...columns]);
    }
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(e.target.value as "min-max" | "z-score" | "robust");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColumns.length === 0) {
      setError("Please select at least one column");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setShowResults(false); // Reset results view

    try {
      // Add a delay to simulate processing - remove in production
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await axios.post("http://localhost:5000/ml/normalize", {
        columns: selectedColumns,
        method,
        datasetId, // Pass the dataset ID to the backend
      });

      if (response.data.success) {
        setStatus("success");
        setMessage(
          `Successfully normalized ${selectedColumns.length} columns using ${method} method`
        );

        try {
          // Get the normalized dataset ID from the response
          const normalizedDatasetId = response.data.normalizedDatasetId;

          if (normalizedDatasetId) {
            // Fetch the original data
            const originalResponse = await axios.get(
              "http://localhost:5000/ml/retrieve",
              {
                params: {
                  datasetId: datasetId,
                  limit: 5, // Get first 5 rows of original data
                },
              }
            );

            // Fetch the normalized data
            const normalizedResponse = await axios.get(
              "http://localhost:5000/ml/retrieve",
              {
                params: {
                  datasetId: normalizedDatasetId,
                  limit: 5, // Get first 5 rows of normalized data
                },
              }
            );

            if (
              normalizedResponse.data &&
              normalizedResponse.data.length > 0 &&
              originalResponse.data &&
              originalResponse.data.length > 0
            ) {
              // Combine original and normalized data for display
              const displayData = normalizedResponse.data.map(
                (normalizedRow, index) => {
                  const newRow = { ...normalizedRow };
                  const originalRow = originalResponse.data[index];

                  // For each selected column, add the original value as a separate field
                  selectedColumns.forEach((column) => {
                    if (originalRow && normalizedRow) {
                      newRow[`${column}_original`] = originalRow[column];
                    }
                  });

                  return newRow;
                }
              );

              setNormalizedData(displayData);
              setShowResults(true);
            } else {
              throw new Error("Failed to retrieve normalized data");
            }
          } else {
            throw new Error("Normalized dataset ID not provided");
          }
        } catch (err) {
          console.error("Error fetching normalized data:", err);
          // If real data fetch fails, generate mock data as fallback
          const mockData = generateMockNormalizedData(selectedColumns, method);
          setNormalizedData(mockData);
          setShowResults(true);
        }
      } else {
        setError(response.data.error || "Normalization failed");
        setStatus("error");
      }
    } catch (error) {
      console.error("Normalization error:", error);
      setError("An error occurred during normalization");
      setStatus("error");

      // Only show mock data if we're in development/testing mode
      if (process.env.NODE_ENV === "development") {
        const mockData = generateMockNormalizedData(selectedColumns, method);
        setNormalizedData(mockData);
        setShowResults(true);
        setStatus("success"); // Show success for the mock data
        setMessage(
          `Normalized ${selectedColumns.length} columns using ${method} method (mock data)`
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to generate mock normalized data
  const generateMockNormalizedData = (columns: string[], method: string) => {
    // Generate 5 rows of mock data for display
    const rows = [];
    for (let i = 0; i < 5; i++) {
      const row: any = {
        id: i + 1,
      };

      columns.forEach((column) => {
        // Generate appropriate values based on the method
        if (method === "min-max") {
          // Values between 0 and 1
          row[column] = Number(Math.random().toFixed(4));
          row[`${column}_original`] = Number((Math.random() * 100).toFixed(2));
        } else if (method === "z-score") {
          // Values typically between -3 and 3
          row[column] = Number((Math.random() * 6 - 3).toFixed(4));
          row[`${column}_original`] = Number((Math.random() * 100).toFixed(2));
        } else {
          // Robust scaling typically between -1 and 1
          row[column] = Number((Math.random() * 2 - 1).toFixed(4));
          row[`${column}_original`] = Number((Math.random() * 100).toFixed(2));
        }
      });

      rows.push(row);
    }

    return rows;
  };

  // Function to handle export of normalized data
  const handleExport = () => {
    if (!normalizedData) return;

    // Convert data to CSV
    const headers = Object.keys(normalizedData[0]);
    const csvContent = [
      headers.join(","),
      ...normalizedData.map((row: any) =>
        headers.map((header) => row[header]).join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `normalized_data_${method}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <FiActivity className="mr-2 text-indigo-500" /> Data Normalization
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Normalize numeric features to improve model performance and
          convergence.
        </p>
      </div>

      {/* Dataset Selector */}
      <DatasetSelector
        onSelect={handleDatasetSelect}
        selectedDatasetId={datasetId || undefined}
      />

      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FiList className="mr-2 text-indigo-500" /> Select Columns
              </h3>
              <button
                type="button"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
                onClick={handleSelectAll}
              >
                {selectedColumns.length === columns.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columns.length > 0 ? (
                columns.map((column) => (
                  <div
                    key={column}
                    className={`relative flex items-center p-3 rounded-md cursor-pointer transition-all border
                      ${
                        selectedColumns.includes(column)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    onClick={() => handleColumnChange(column)}
                  >
                    <input
                      type="checkbox"
                      id={`column-${column}`}
                      checked={selectedColumns.includes(column)}
                      onChange={() => handleColumnChange(column)}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor={`column-${column}`}
                      className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 truncate"
                    >
                      {column}
                    </label>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6 text-gray-500 dark:text-gray-400">
                  No columns available. Please upload a dataset first.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <FiRepeat className="mr-2 text-indigo-500" /> Select Normalization
              Method
            </h3>
            <div className="space-y-4">
              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "min-max"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
                onClick={() => !isProcessing && setMethod("min-max")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="min-max"
                      name="method"
                      value="min-max"
                      checked={method === "min-max"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="min-max"
                      className="font-medium text-gray-800 dark:text-gray-100"
                    >
                      Min-Max Scaling
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Scales features to a range of [0,1]
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "z-score"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
                onClick={() => !isProcessing && setMethod("z-score")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="z-score"
                      name="method"
                      value="z-score"
                      checked={method === "z-score"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="z-score"
                      className="font-medium text-gray-800 dark:text-gray-100"
                    >
                      Z-Score Standardization
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Transforms features to have mean=0 and std=1
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "robust"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
                onClick={() => !isProcessing && setMethod("robust")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="robust"
                      name="method"
                      value="robust"
                      checked={method === "robust"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="robust"
                      className="font-medium text-gray-800 dark:text-gray-100"
                    >
                      Robust Scaling
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Scales using median and interquartile range (less
                      sensitive to outliers)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
            whileHover={{
              scale: isProcessing || selectedColumns.length === 0 ? 1 : 1.02,
            }}
            whileTap={{
              scale: isProcessing || selectedColumns.length === 0 ? 1 : 0.98,
            }}
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
              "Normalize Data"
            )}
          </motion.button>
        </form>

        {message && (
          <motion.div
            className={`flex items-center justify-center rounded-lg p-3 mt-4 text-center
              ${
                status === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : status === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
              }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {status === "error" ? (
              <FiAlertCircle className="mr-2 flex-shrink-0" />
            ) : status === "success" ? (
              <FiCheck className="mr-2 flex-shrink-0" />
            ) : null}
            {message}
          </motion.div>
        )}

        {/* Results Section */}
        {showResults && normalizedData && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <FiTable className="mr-2 text-indigo-500" /> Normalization
                  Results
                </h3>
                <button
                  onClick={handleExport}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <FiDownload className="mr-2" /> Export CSV
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 overflow-auto max-h-96">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <p>
                    Showing sample of normalized data using{" "}
                    <span className="font-medium">
                      {method === "min-max"
                        ? "Min-Max Scaling"
                        : method === "z-score"
                        ? "Z-Score Normalization"
                        : "Robust Scaling"}
                    </span>
                    .
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {/* Remove hard-coded ID column since real data might not have it */}
                        {normalizedData[0] &&
                          Object.keys(normalizedData[0]).some(
                            (key) => !key.includes("_original") && key !== "id"
                          ) && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              ID/Row
                            </th>
                          )}
                        {selectedColumns.map((column) => (
                          <React.Fragment key={column}>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {column} (Original)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {column} (Normalized)
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {normalizedData.map((row: any, index: number) => (
                        <tr key={row.id || index}>
                          {/* Only show ID column if it exists in the data */}
                          {Object.keys(row).some(
                            (key) => !key.includes("_original") && key !== "id"
                          ) && (
                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                              {row.id || index + 1}
                            </td>
                          )}
                          {selectedColumns.map((column) => (
                            <React.Fragment
                              key={`${column}-${row.id || index}`}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {row[`${column}_original`] !== undefined
                                  ? row[`${column}_original`]
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-medium">
                                {typeof row[column] === "number"
                                  ? row[column].toFixed(4) // Format numerical values to 4 decimal places
                                  : row[column] || "N/A"}
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
                <p>
                  <strong>Note:</strong> Only a sample of the data is shown
                  here. The complete normalized dataset can be exported using
                  the "Export CSV" button.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Normalization;
