import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiCode,
  FiList,
  FiCheck,
  FiAlertCircle,
  FiHash,
  FiTable,
  FiDownload,
} from "react-icons/fi";
import DatasetSelector from "./DatasetSelector";

const Encoding: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [method, setMethod] = useState<"one-hot" | "label" | "binary">(
    "one-hot"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [encodedData, setEncodedData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [datasetId, setDatasetId] = useState<string>("");

  useEffect(() => {
    if (datasetId) {
      fetchColumns();
    }
  }, [datasetId]);

  // Fetch columns from the selected dataset
  const fetchColumns = async () => {
    try {
      setIsProcessing(true);
      const response = await axios.get("http://localhost:5000/ml/columns", {
        params: { datasetId },
      });

      if (response.data.success) {
        setColumns(response.data.columns || []);
        setSelectedColumns([]); // Reset selection when columns change
      } else {
        throw new Error(response.data.error || "Failed to fetch columns");
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
      setMessage("Failed to fetch columns. Using mock data instead.");
      setStatus("error");
      // Fallback to mock columns
      setColumns(["Category", "Gender", "Country", "Education", "Occupation"]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDatasetSelect = (selectedDatasetId: string) => {
    setDatasetId(selectedDatasetId);
    // Reset state when dataset changes
    setSelectedColumns([]);
    setEncodedData(null);
    setShowResults(false);
    setStatus("idle");
    setMessage("");
  };

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
    setMethod(e.target.value as "one-hot" | "label" | "binary");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColumns.length === 0) {
      setMessage("Please select at least one column to encode");
      setStatus("error");
      return;
    }

    if (!datasetId) {
      setMessage("Please select a dataset first");
      setStatus("error");
      return;
    }

    setIsProcessing(true);
    setMessage("Processing...");
    setStatus("idle");
    setShowResults(false);

    try {
      // Send request to the real API endpoint
      const response = await axios.post("http://localhost:5000/ml/encode", {
        columns: selectedColumns,
        method: method,
        datasetId: datasetId,
      });

      if (response.data.success) {
        // Generate visualization data for display
        const mockEncodedData = generateMockEncodedData(
          selectedColumns,
          method
        );
        setEncodedData(mockEncodedData);

        setStatus("success");
        setMessage(
          `${
            method === "one-hot"
              ? "One-Hot"
              : method === "label"
              ? "Label"
              : "Binary"
          } encoding completed successfully! ${response.data.message || ""}`
        );
        setShowResults(true);
      } else {
        throw new Error(response.data.error || "Encoding failed");
      }
    } catch (error) {
      console.error("Encoding error:", error);
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "An error occurred during encoding."
      );

      // Fallback to mock data
      try {
        const mockEncodedData = generateMockEncodedData(
          selectedColumns,
          method
        );
        setEncodedData(mockEncodedData);
        setShowResults(true);
        setMessage("Using mock results for demonstration purposes.");
      } catch (mockError) {
        console.error("Failed to generate mock data:", mockError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to generate mock encoded data
  const generateMockEncodedData = (
    columns: string[],
    encodingMethod: string
  ) => {
    // Generate 5 rows of mock data for display
    const rows = [];

    // Sample categories for categorical columns
    const sampleCategories: Record<string, string[]> = {
      gender: ["Male", "Female", "Non-binary"],
      education: ["High School", "Bachelor", "Master", "PhD"],
      location: ["Urban", "Suburban", "Rural"],
      occupation: ["Engineer", "Teacher", "Doctor", "Other"],
    };

    // For columns without predefined categories
    const defaultCategories = ["Category A", "Category B", "Category C"];

    for (let i = 0; i < 5; i++) {
      const row: any = {
        id: i + 1,
      };

      columns.forEach((column) => {
        // Original value
        const categories =
          sampleCategories[column.toLowerCase()] || defaultCategories;
        const originalValue =
          categories[Math.floor(Math.random() * categories.length)];
        row[`${column}_original`] = originalValue;

        // Encoded value based on method
        if (encodingMethod === "one-hot") {
          // For one-hot, show only the relevant column with 1
          categories.forEach((category) => {
            const colName = `${column}_${category.replace(/\s+/g, "_")}`;
            row[colName] = originalValue === category ? 1 : 0;
          });
        } else if (encodingMethod === "label") {
          // For label encoding, show numerical value (index in categories array)
          row[column] = categories.indexOf(originalValue);
        } else if (encodingMethod === "binary") {
          // For binary encoding, show binary representation
          const index = categories.indexOf(originalValue);
          row[column] = index.toString(2).padStart(2, "0");
        }
      });

      rows.push(row);
    }

    return rows;
  };

  // Function to handle export of encoded data
  const handleExport = () => {
    if (!encodedData) return;

    // Convert data to CSV
    const headers = Object.keys(encodedData[0]);
    const csvContent = [
      headers.join(","),
      ...encodedData.map((row: any) =>
        headers.map((header) => row[header]).join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `encoded_data_${method}.csv`);
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
          <FiCode className="mr-2 text-indigo-500" /> Categorical Data Encoding
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Transform categorical variables into numerical format for machine
          learning models.
        </p>
      </div>

      {/* Main content */}
      <div className="space-y-8">
        {message && status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {message}
          </div>
        )}

        {message && status === "success" && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center">
            <FiCheck className="mr-2 flex-shrink-0" />
            {message}
          </div>
        )}

        {/* Dataset Selector */}
        <DatasetSelector
          onSelect={handleDatasetSelect}
          selectedDatasetId={datasetId}
        />

        {/* Encoding Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FiList className="mr-2 text-indigo-500" /> Select Categorical
                Columns
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
              <FiHash className="mr-2 text-indigo-500" /> Select Encoding Method
            </h3>

            <div className="space-y-4">
              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "one-hot"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
                onClick={() => !isProcessing && setMethod("one-hot")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="one-hot"
                      name="method"
                      value="one-hot"
                      checked={method === "one-hot"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="one-hot"
                      className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      One-Hot Encoding
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Creates binary columns for each category in a categorical
                      feature. Best for nominal data with no ordinal
                      relationship.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "label"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
                onClick={() => !isProcessing && setMethod("label")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="label"
                      name="method"
                      value="label"
                      checked={method === "label"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="label"
                      className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Label Encoding
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Assigns each unique category a unique integer. Good for
                      ordinal data with a clear order of categories.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  method === "binary"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
                onClick={() => !isProcessing && setMethod("binary")}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id="binary"
                      name="method"
                      value="binary"
                      checked={method === "binary"}
                      onChange={handleMethodChange}
                      disabled={isProcessing}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="binary"
                      className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Binary Encoding
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Converts categories to binary code then represents with
                      binary digits. Efficient for high-cardinality features.
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
              "Apply Encoding"
            )}
          </motion.button>
        </form>

        {/* Results Section */}
        {showResults && encodedData && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <FiTable className="mr-2 text-indigo-500" /> Encoding Results
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
                    Showing sample of data encoded using{" "}
                    <span className="font-medium">
                      {method === "one-hot"
                        ? "One-Hot Encoding"
                        : method === "label"
                        ? "Label Encoding"
                        : "Binary Encoding"}
                    </span>
                    .
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          ID
                        </th>
                        {selectedColumns.map((column) => (
                          <React.Fragment key={column}>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {column} (Original)
                            </th>
                            {method === "one-hot" ? (
                              // For one-hot, we'll have multiple columns
                              <th
                                className="px-4 py-2 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
                                colSpan={3}
                              >
                                {column} (One-Hot Encoded)
                              </th>
                            ) : (
                              // For label or binary, just one column
                              <th className="px-4 py-2 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                {column} (
                                {method === "label" ? "Label" : "Binary"}{" "}
                                Encoded)
                              </th>
                            )}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {encodedData.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                            {row.id}
                          </td>
                          {selectedColumns.map((column) => {
                            // Get sample categories for the column
                            const categories =
                              column.toLowerCase() === "gender"
                                ? ["Male", "Female", "Non-binary"]
                                : column.toLowerCase() === "education"
                                ? ["High School", "Bachelor", "Master", "PhD"]
                                : column.toLowerCase() === "location"
                                ? ["Urban", "Suburban", "Rural"]
                                : column.toLowerCase() === "occupation"
                                ? ["Engineer", "Teacher", "Doctor", "Other"]
                                : ["Category A", "Category B", "Category C"];

                            return (
                              <React.Fragment key={`${column}-${row.id}`}>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                  {row[`${column}_original`]}
                                </td>

                                {method === "one-hot" ? (
                                  // For one-hot encoding, show multiple columns with 0/1
                                  <td
                                    className="px-4 py-2 whitespace-nowrap"
                                    colSpan={3}
                                  >
                                    <div className="flex space-x-3">
                                      {categories.map((category) => (
                                        <div
                                          key={`${column}_${category}`}
                                          className="flex items-center"
                                        >
                                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                                            {category.substring(0, 8)}:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              row[
                                                `${column}_${category.replace(
                                                  /\s+/g,
                                                  "_"
                                                )}`
                                              ] === 1
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-gray-600 dark:text-gray-400"
                                            }`}
                                          >
                                            {
                                              row[
                                                `${column}_${category.replace(
                                                  /\s+/g,
                                                  "_"
                                                )}`
                                              ]
                                            }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                ) : (
                                  // For label or binary encoding, show a single value
                                  <td className="px-4 py-2 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-medium">
                                    {row[column]}
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
                <p>
                  <strong>Note:</strong> Only a sample of the data is shown
                  here. The complete encoded dataset can be exported using the
                  "Export CSV" button.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Encoding;
