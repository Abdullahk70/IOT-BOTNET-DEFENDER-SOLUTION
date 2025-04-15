import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiFile,
  FiFilter,
  FiInfo,
  FiUploadCloud,
  FiAlertCircle,
} from "react-icons/fi";
import Plot from "react-plotly.js";
import DatasetSelector from "./DatasetSelector";

interface OutlierResult {
  outliers: number[];
  inliers: number[];
  outlierIndices: number[];
  totalPoints: number;
  outlierPercentage: number;
  method: string;
  parameters: Record<string, any>;
}

const OutlierDetection: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [method, setMethod] = useState<string>("iforest");
  const [threshold, setThreshold] = useState<number>(0.1);
  const [contamination, setContamination] = useState<number>(0.1);
  const [results, setResults] = useState<OutlierResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Additional parameters for different methods
  const [neighborhoodSize, setNeighborhoodSize] = useState<number>(20);
  const [minSamples, setMinSamples] = useState<number>(5);
  const [eps, setEps] = useState<number>(0.5);

  // Available detection methods
  const detectionMethods = [
    {
      id: "iforest",
      name: "Isolation Forest",
      description:
        "Efficiently detects outliers using random forests, particularly effective with high-dimensional data.",
    },
    {
      id: "lof",
      name: "Local Outlier Factor",
      description:
        "Identifies outliers by measuring the local deviation of a point with respect to its neighbors.",
    },
    {
      id: "ocsvm",
      name: "One-Class SVM",
      description:
        "Creates a boundary that separates all the normal data points from the origin, and considers points outside this boundary as outliers.",
    },
    {
      id: "dbscan",
      name: "DBSCAN",
      description:
        "Density-based clustering that groups together points that are close to each other, labeling points in low-density regions as outliers.",
    },
  ];

  // Fetch columns from the selected dataset
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
        setResults(null);
        setError(null);
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

  const handleColumnSelect = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMethod(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (selectedColumns.length === 0) {
      setError("Please select at least one column for outlier detection");
      return;
    }

    if (!datasetId) {
      setError("Please select a dataset first");
      return;
    }

    setIsLoading(true);

    try {
      // Construct parameters based on the selected method
      const params: Record<string, any> = {
        method,
        columns: selectedColumns,
        datasetId,
      };

      if (method === "iforest" || method === "ocsvm") {
        params.contamination = contamination;
      } else if (method === "lof") {
        params.n_neighbors = neighborhoodSize;
        params.contamination = contamination;
      } else if (method === "dbscan") {
        params.eps = eps;
        params.min_samples = minSamples;
      }

      const response = await axios.post(
        "http://localhost:5000/ml/outliers",
        params
      );

      if (response.data.success) {
        // Use the actual response data
        setResults({
          outliers: response.data.outliers || [],
          inliers: response.data.inliers || [],
          outlierIndices: response.data.outlier_indices || [],
          totalPoints: response.data.total_points || 0,
          outlierPercentage: response.data.outlier_percentage || 0,
          method: response.data.method || method,
          parameters: response.data.parameters || params,
        });
      } else {
        throw new Error(response.data.error || "Failed to detect outliers");
      }
    } catch (error) {
      console.error("Error detecting outliers:", error);

      // If the API call fails, generate mock results for demonstration
      const mockResults = generateMockResults(selectedColumns);
      setResults(mockResults);
      setError(
        "Could not connect to server - showing mock results for demonstration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate mock outlier detection results
  const generateMockResults = (columns: string[]): OutlierResult => {
    const totalPoints = 100;
    const outlierCount = Math.floor(totalPoints * contamination);

    // Generate random indices for outliers
    const outlierIndices = Array.from({ length: outlierCount }, () =>
      Math.floor(Math.random() * totalPoints)
    );

    // Generate mock data points - in a real implementation, these would be actual data values
    const outliers = outlierIndices.map(() => Math.random() * 100);

    // Generate inliers (non-outlier points)
    const inliers = Array.from(
      { length: totalPoints - outlierCount },
      () => Math.random() * 50 + 25
    );

    return {
      outliers,
      inliers,
      outlierIndices,
      totalPoints,
      outlierPercentage: (outlierCount / totalPoints) * 100,
      method,
      parameters: {
        contamination,
        columns,
      },
    };
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
          <FiAlertTriangle className="mr-2 text-indigo-500" /> Outlier Detection
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Identify anomalies and outliers in your dataset using various
          detection algorithms.
        </p>
      </div>

      {/* Dataset Selector */}
      <DatasetSelector
        onSelect={handleDatasetSelect}
        selectedDatasetId={datasetId || undefined}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiFilter className="mr-2 text-indigo-500" /> Detection Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="method"
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Detection Method
              </label>
              <select
                id="method"
                value={method}
                onChange={handleMethodChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {detectionMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {detectionMethods.find((m) => m.id === method)?.description}
              </p>
            </div>

            {(method === "iforest" ||
              method === "ocsvm" ||
              method === "lof") && (
              <div>
                <label
                  htmlFor="contamination"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Contamination
                </label>
                <div className="flex items-center">
                  <input
                    id="contamination"
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={contamination}
                    onChange={(e) =>
                      setContamination(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 w-12 text-center text-gray-700 dark:text-gray-300">
                    {contamination.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Expected proportion of outliers in the dataset
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-2"
            >
              Advanced Parameters
              <FiChevronDown
                className={`ml-1 transform transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdvanced && (
              <motion.div
                className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                {method === "lof" && (
                  <div className="mb-4">
                    <label
                      htmlFor="neighbors"
                      className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >
                      Number of Neighbors
                    </label>
                    <input
                      id="neighbors"
                      type="number"
                      min="1"
                      max="100"
                      value={neighborhoodSize}
                      onChange={(e) =>
                        setNeighborhoodSize(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      The number of neighbors to consider for each point
                    </p>
                  </div>
                )}

                {method === "dbscan" && (
                  <>
                    <div className="mb-4">
                      <label
                        htmlFor="eps"
                        className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                      >
                        Epsilon (Neighborhood Distance)
                      </label>
                      <input
                        id="eps"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={eps}
                        onChange={(e) =>
                          setEps(
                            Math.max(0.1, parseFloat(e.target.value) || 0.1)
                          )
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        The maximum distance between two samples for one to be
                        considered in the neighborhood of the other
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="minSamples"
                        className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                      >
                        Minimum Samples
                      </label>
                      <input
                        id="minSamples"
                        type="number"
                        min="1"
                        value={minSamples}
                        onChange={(e) =>
                          setMinSamples(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        The number of samples in a neighborhood for a point to
                        be considered as a core point
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiBarChart2 className="mr-2 text-indigo-500" /> Select Columns
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {columns.map((column) => (
              <div
                key={column}
                className={`relative flex items-center p-3 rounded-md cursor-pointer transition-all border
                  ${
                    selectedColumns.includes(column)
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                onClick={() => handleColumnSelect(column)}
              >
                <input
                  type="checkbox"
                  id={`column-${column}`}
                  checked={selectedColumns.includes(column)}
                  onChange={() => handleColumnSelect(column)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor={`column-${column}`}
                  className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 truncate"
                >
                  {column}
                </label>
              </div>
            ))}
          </div>

          {columns.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No columns available. Please select a dataset first.
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
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
          whileHover={{
            scale: isLoading || selectedColumns.length === 0 ? 1 : 1.02,
          }}
          whileTap={{
            scale: isLoading || selectedColumns.length === 0 ? 1 : 0.98,
          }}
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
            "Detect Outliers"
          )}
        </motion.button>
      </form>

      {/* Results Section */}
      {results && (
        <motion.div
          className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiCheckCircle className="mr-2 text-green-500" /> Outlier Detection
            Results
          </h3>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Method:
                  </span>{" "}
                  {detectionMethods.find((m) => m.id === results.method)
                    ?.name || results.method}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Selected Features:
                  </span>{" "}
                  {selectedColumns.join(", ")}
                </div>
              </div>

              <div className="mt-4 md:mt-0 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {results.outlierPercentage.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Outliers Detected
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Data Points
                </div>
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {results.totalPoints.toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Inliers
                </div>
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {(
                    results.totalPoints - results.outliers.length
                  ).toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Outliers
                </div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {results.outliers.length.toLocaleString()}
                </div>
              </div>
            </div>

            {selectedColumns.length <= 2 && results?.outliers?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Outlier Visualization
                </h4>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <Plot
                    data={[
                      {
                        x: results.inliers.map(() => Math.random() * 10), // Mock X coordinates for inliers
                        y:
                          selectedColumns.length > 1
                            ? results.inliers.map(() => Math.random() * 10)
                            : results.inliers,
                        mode: "markers",
                        type: "scatter",
                        marker: {
                          color: "rgba(24, 90, 219, 0.6)",
                          size: 8,
                        },
                        name: "Normal Data",
                      },
                      {
                        x: results.outliers.map(() => Math.random() * 20 - 5), // Mock X coordinates for outliers
                        y:
                          selectedColumns.length > 1
                            ? results.outliers.map(() => Math.random() * 20 - 5)
                            : results.outliers,
                        mode: "markers",
                        type: "scatter",
                        marker: {
                          color: "rgba(255, 65, 54, 0.8)",
                          size: 10,
                          symbol: "circle-open",
                          line: {
                            width: 2,
                            color: "rgba(255, 65, 54, 1)",
                          },
                        },
                        name: "Outliers",
                      },
                    ]}
                    layout={{
                      title: `Outlier Visualization (${selectedColumns.join(
                        " vs "
                      )})`,
                      autosize: true,
                      height: 400,
                      margin: { t: 60, r: 20, b: 60, l: 60 },
                      xaxis: {
                        title: selectedColumns[0] || "Feature 1",
                      },
                      yaxis: {
                        title:
                          selectedColumns[1] || selectedColumns[0] || "Value",
                      },
                      hovermode: "closest",
                      showlegend: true,
                      legend: {
                        x: 0,
                        y: 1.1,
                      },
                      template: {
                        data: {
                          scatter: [
                            {
                              type: "scatter",
                              marker: {
                                colorbar: {
                                  outlinewidth: 0,
                                  ticks: "",
                                },
                              },
                            },
                          ],
                        },
                        layout: {
                          colorway: [
                            "#636efa",
                            "#EF553B",
                            "#00cc96",
                            "#ab63fa",
                          ],
                          font: {
                            color: "#000000",
                          },
                          plot_bgcolor: "white",
                        },
                      },
                    }}
                    config={{
                      displayModeBar: true,
                      responsive: true,
                    }}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}

            {results?.outlierIndices?.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Outlier Indices
                  </h4>
                  <button
                    type="button"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    onClick={() => {
                      // Copy indices to clipboard
                      navigator.clipboard.writeText(
                        results.outlierIndices.join(", ")
                      );
                    }}
                  >
                    Copy All
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {results.outlierIndices.slice(0, 100).join(", ")}
                    {results.outlierIndices.length > 100 ? "..." : ""}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Showing {Math.min(100, results.outlierIndices.length)} of{" "}
                  {results.outlierIndices.length} outlier indices
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg">
            <FiInfo className="mr-2" />
            <p className="text-sm">
              You can use these outlier indices to filter your dataset or
              investigate the detected anomalies further.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OutlierDetection;
