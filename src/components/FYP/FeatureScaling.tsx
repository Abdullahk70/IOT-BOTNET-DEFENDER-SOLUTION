import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiZap,
  FiBarChart2,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";

const FeatureScaling: React.FC = () => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([
    "age",
    "income",
    "spending",
    "duration",
    "transactions",
    "balance",
  ]);
  const [scalingMethod, setScalingMethod] = useState<string>("min-max");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasScaled, setHasScaled] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Mock scaling methods and their descriptions
  const scalingMethods = [
    {
      id: "min-max",
      name: "Min-Max Scaling",
      description:
        "Transforms features by scaling each feature to a given range (usually [0, 1]).",
    },
    {
      id: "standard",
      name: "Standard Scaling (Z-score)",
      description:
        "Standardizes features by removing the mean and scaling to unit variance.",
    },
    {
      id: "robust",
      name: "Robust Scaling",
      description:
        "Scales features using statistics that are robust to outliers.",
    },
    {
      id: "log",
      name: "Log Transformation",
      description: "Applies logarithm to reduce the effect of extreme values.",
    },
    {
      id: "quantile",
      name: "Quantile Transformation",
      description: "Maps data to a uniform or normal distribution.",
    },
  ];

  // Toggle column selection
  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  // Handle scaling method change
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScalingMethod(e.target.value);
  };

  // Handle all columns selection
  const handleSelectAll = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...availableColumns]);
    }
  };

  // Generate mock preview data for the selected columns
  const generatePreviewData = () => {
    // For demo purposes, generate some random data
    const mockData = [];

    // Create before/after pairs for each selected column
    for (let i = 0; i < Math.min(5, selectedColumns.length); i++) {
      const column = selectedColumns[i];

      // Generate original values (4 sample values)
      const originalValues = Array(4)
        .fill(0)
        .map(() => {
          return parseFloat((Math.random() * 100).toFixed(2));
        });

      // Calculate transformed values based on selected method
      let transformedValues;

      if (scalingMethod === "min-max") {
        // Min-Max scaling
        const min = Math.min(...originalValues);
        const max = Math.max(...originalValues);
        transformedValues = originalValues.map((val) =>
          parseFloat(((val - min) / (max - min)).toFixed(4))
        );
      } else if (scalingMethod === "standard") {
        // Standard scaling (Z-score)
        const mean =
          originalValues.reduce((a, b) => a + b, 0) / originalValues.length;
        const stdDev = Math.sqrt(
          originalValues
            .map((x) => Math.pow(x - mean, 2))
            .reduce((a, b) => a + b, 0) / originalValues.length
        );
        transformedValues = originalValues.map((val) =>
          parseFloat(((val - mean) / stdDev).toFixed(4))
        );
      } else if (scalingMethod === "log") {
        // Log transformation
        transformedValues = originalValues.map((val) =>
          parseFloat(Math.log(val + 1).toFixed(4))
        );
      } else {
        // Default to just showing some transformed values
        transformedValues = originalValues.map((val) =>
          parseFloat((val / Math.max(...originalValues)).toFixed(4))
        );
      }

      // Create a preview object for this column
      mockData.push({
        column,
        original: originalValues,
        transformed: transformedValues,
      });
    }

    return mockData;
  };

  // Handle preview generation
  const handleShowPreview = () => {
    if (selectedColumns.length === 0) {
      setErrorMessage("Please select at least one column to preview");
      setStatus("error");
      return;
    }

    setPreviewData(generatePreviewData());
    setShowPreview(true);
    setErrorMessage(null);
    setStatus("idle");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColumns.length === 0) {
      setErrorMessage("Please select at least one column to scale");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatus("idle");

    try {
      // In a real implementation, this would be an API call to the backend
      // For demo purposes, we'll simulate a successful response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful scaling result
      const scaledResult = {
        success: true,
        message: `Successfully applied ${
          scalingMethods.find((m) => m.id === scalingMethod)?.name
        } to ${selectedColumns.length} columns`,
        stats: {
          timeElapsed: "0.35s",
          columnsScaled: selectedColumns,
          method: scalingMethod,
          originalRange: [
            { column: selectedColumns[0], min: 10.5, max: 98.7 },
            selectedColumns.length > 1
              ? { column: selectedColumns[1], min: 2.1, max: 45.3 }
              : null,
          ].filter(Boolean),
          transformedRange: [
            { column: selectedColumns[0], min: 0, max: 1 },
            selectedColumns.length > 1
              ? { column: selectedColumns[1], min: 0, max: 1 }
              : null,
          ].filter(Boolean),
        },
      };

      setResult(scaledResult);
      setHasScaled(true);
      setStatus("success");
    } catch (error) {
      console.error("Error during feature scaling:", error);
      setErrorMessage(
        "An error occurred during feature scaling. Please try again."
      );
      setStatus("error");
    } finally {
      setIsLoading(false);
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
          <FiZap className="mr-2 text-indigo-500" /> Feature Scaling
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Standardize or normalize features to improve model performance and
          convergence.
        </p>
      </div>

      <div className="space-y-8">
        {errorMessage && status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            {result?.message || "Feature scaling completed successfully!"}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiBarChart2 className="mr-2 text-indigo-500" /> Scaling Method
          </h3>

          <div>
            <label
              htmlFor="scaling-method"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Select Scaling Method
            </label>
            <select
              id="scaling-method"
              value={scalingMethod}
              onChange={handleMethodChange}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {scalingMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {scalingMethods.find((m) => m.id === scalingMethod)?.description}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <FiLayers className="mr-2 text-indigo-500" /> Feature Columns
            </h3>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
            >
              {selectedColumns.length === availableColumns.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableColumns.map((column) => (
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

          {availableColumns.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No columns found. Please upload a valid dataset first.
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <motion.button
            type="button"
            onClick={handleShowPreview}
            className="flex items-center justify-center px-6 py-3 rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 font-medium transition-all duration-300 border border-indigo-200 dark:border-indigo-800"
            disabled={isLoading || selectedColumns.length === 0}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            <FiEye className="mr-2" />
            Preview Scaling
          </motion.button>

          <motion.button
            type="button"
            onClick={handleSubmit}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
                      ${
                        isLoading
                          ? "bg-indigo-600/80"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } 
                      ${
                        selectedColumns.length === 0
                          ? "opacity-60 cursor-not-allowed"
                          : "shadow-md hover:shadow-lg"
                      }`}
            disabled={isLoading || selectedColumns.length === 0}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
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
              "Apply Scaling"
            )}
          </motion.button>
        </div>

        {showPreview && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Scaling Preview
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Method:{" "}
                {scalingMethods.find((m) => m.id === scalingMethod)?.name}
              </p>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Column
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Original Values
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        After Scaling
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {previewData.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/50"
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.column}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex flex-wrap gap-2">
                            {item.original.map((val: number, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex flex-wrap gap-2">
                            {item.transformed.map((val: number, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  This is a preview with sample data. Actual results may vary
                  based on your dataset.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Scaling Results
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Processed in {result.stats.timeElapsed}
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <div className="text-indigo-800 dark:text-indigo-300 font-semibold mb-1">
                    Method
                  </div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {
                      scalingMethods.find((m) => m.id === result.stats.method)
                        ?.name
                    }
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <div className="text-purple-800 dark:text-purple-300 font-semibold mb-1">
                    Columns Scaled
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {result.stats.columnsScaled.length}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-blue-800 dark:text-blue-300 font-semibold mb-1">
                    Execution Time
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {result.stats.timeElapsed}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Scaling Summary
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Column
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Original Range
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Transformed Range
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {result.stats.originalRange.map(
                        (item: any, idx: number) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800/50"
                            }
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.column}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {item.min.toFixed(2)} to {item.max.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {result.stats.transformedRange[idx].min.toFixed(
                                2
                              )}{" "}
                              to{" "}
                              {result.stats.transformedRange[idx].max.toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Feature scaling complete. The scaled features are now
                  available for further processing.
                </p>
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue to Next Step
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FeatureScaling;
