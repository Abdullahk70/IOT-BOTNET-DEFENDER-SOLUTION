import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Plot from "react-plotly.js";
import {
  FiFilter,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiSettings,
  FiLayers,
} from "react-icons/fi";
import DatasetSelector from "./DatasetSelector";

const FeatureSelection: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [selectionMethod, setSelectionMethod] = useState<
    "filter" | "wrapper" | "embedded"
  >("filter");
  const [specificMethod, setSpecificMethod] = useState<string>("correlation");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [numberOfFeatures, setNumberOfFeatures] = useState<number>(5);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [datasetId, setDatasetId] = useState<string>("");

  // Available methods by category
  const methods = {
    filter: [
      {
        id: "correlation",
        name: "Correlation",
        description:
          "Select features based on their correlation with the target variable.",
      },
      {
        id: "chi-square",
        name: "Chi-Square Test",
        description:
          "Statistical test to measure dependence between categorical variables.",
      },
      {
        id: "mutual-info",
        name: "Mutual Information",
        description:
          "Measures how much information one variable provides about another.",
      },
      {
        id: "variance",
        name: "Variance Threshold",
        description: "Remove features with low variance.",
      },
    ],
    wrapper: [
      {
        id: "forward",
        name: "Forward Selection",
        description: "Iteratively add features that improve model performance.",
      },
      {
        id: "backward",
        name: "Backward Elimination",
        description:
          "Start with all features and iteratively remove the least important ones.",
      },
      {
        id: "recursive",
        name: "Recursive Feature Elimination",
        description:
          "Recursively removes features and builds a model on remaining ones.",
      },
    ],
    embedded: [
      {
        id: "lasso",
        name: "LASSO Regularization",
        description:
          "Linear model with L1 regularization that can set coefficients to zero.",
      },
      {
        id: "tree-importance",
        name: "Tree-based Importance",
        description:
          "Extract feature importance from tree-based models like Random Forest.",
      },
      {
        id: "elasticnet",
        name: "Elastic Net",
        description: "Linear model with combined L1 and L2 regularization.",
      },
    ],
  };

  // Handle dataset selection
  const handleDatasetSelect = (selectedDatasetId: string) => {
    setDatasetId(selectedDatasetId);
    fetchColumns(selectedDatasetId);
    // Reset results when dataset changes
    setResults(null);
    setStatus("idle");
  };

  // Update fetchColumns to use datasetId
  const fetchColumns = async (selectedDatasetId: string) => {
    try {
      setColumns([]);
      setSelectedColumns([]);
      setStatus("idle");
      setErrorMessage(null);

      const response = await axios.get("http://localhost:5000/ml/columns", {
        params: { datasetId: selectedDatasetId },
      });

      if (response.data.success) {
        setColumns(response.data.columns);
        if (response.data.columns.length > 0) {
          // Set last column as default target (common for classification datasets)
          setTargetColumn(
            response.data.columns[response.data.columns.length - 1]
          );
          // Select all columns except target as features by default
          setSelectedColumns(
            response.data.columns.filter(
              (col) =>
                col !== response.data.columns[response.data.columns.length - 1]
            )
          );
        }
      } else {
        setStatus("error");
        setErrorMessage("Failed to fetch columns");
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
      setStatus("error");
      setErrorMessage("Failed to connect to the server");

      // For demonstration, set mock columns
      const mockColumns = [
        "age",
        "income",
        "education",
        "employment",
        "housing",
        "loan",
        "contact",
        "month",
        "day",
        "duration",
        "campaign",
        "previous",
        "poutcome",
        "deposit",
      ];

      setColumns(mockColumns);
      setTargetColumn(mockColumns[mockColumns.length - 1]);
      setSelectedColumns(mockColumns.slice(0, -1));
    }
  };

  // Handle selection method change
  const handleMethodCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.target.value as "filter" | "wrapper" | "embedded";
    setSelectionMethod(method);
    // Set first method of the category as default
    setSpecificMethod(methods[method][0].id);
  };

  // Handle specific method change
  const handleSpecificMethodChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSpecificMethod(e.target.value);
  };

  // Handle target column change
  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = e.target.value;
    setTargetColumn(target);

    // Remove target from selected columns if it's there
    setSelectedColumns((prev) => prev.filter((col) => col !== target));
  };

  // Handle feature toggle
  const handleFeatureToggle = (column: string) => {
    if (column === targetColumn) return; // Can't select target as a feature

    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((col) => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Select all features
  const handleSelectAll = () => {
    if (
      selectedColumns.length ===
      columns.filter((col) => col !== targetColumn).length
    ) {
      // If all are selected, deselect all
      setSelectedColumns([]);
    } else {
      // Otherwise select all except target
      setSelectedColumns(columns.filter((col) => col !== targetColumn));
    }
  };

  // Handle number of features change
  const handleNumberOfFeaturesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    setNumberOfFeatures(Math.min(Math.max(1, value), selectedColumns.length));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColumns.length === 0) {
      setErrorMessage("Please select at least one feature column");
      setStatus("error");
      return;
    }

    if (!targetColumn) {
      setErrorMessage("Please select a target column");
      setStatus("error");
      return;
    }

    if (!datasetId) {
      setErrorMessage("Please select a dataset first");
      setStatus("error");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setResults(null);
    setStatus("idle");

    try {
      // Make actual API call to the backend
      const response = await axios.post(
        "http://localhost:5000/ml/feature-selection",
        {
          columns: selectedColumns,
          target: targetColumn,
          method: specificMethod,
          top_features: numberOfFeatures,
          datasetId: datasetId,
        }
      );

      if (response.data.success) {
        // Process real API response
        const featureResults = response.data.results.map(
          (feature: any, index: number) => ({
            ...feature,
            rank: index + 1,
          })
        );

        // Create visualizations data from real results
        const barChartData = {
          x: featureResults.map((f: any) => f.feature),
          y: featureResults.map((f: any) => f.score),
          type: "bar",
          marker: {
            color: featureResults.map(
              (_: any, i: number) =>
                `rgba(55, 128, 191, ${1 - (i * 0.7) / featureResults.length})`
            ),
          },
        };

        setResults({
          method: {
            category: selectionMethod,
            specific: specificMethod,
            name: methods[selectionMethod].find((m) => m.id === specificMethod)
              ?.name,
          },
          allFeatures: featureResults,
          selectedFeatures: featureResults,
          visualizations: {
            barChart: barChartData,
          },
          executionTime: response.data.processingTime || "1.2s",
        });

        setStatus("success");
        setErrorMessage("Feature selection completed successfully!");
      } else {
        throw new Error(response.data.error || "Feature selection failed");
      }
    } catch (error) {
      console.error("Error during feature selection:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred during feature selection process."
      );
      setStatus("error");

      // Only in development mode or as fallback, generate mock results
      if (process.env.NODE_ENV === "development") {
        // Generate mock results
        const mockFeatureScores = selectedColumns.map((column) => ({
          feature: column,
          score: parseFloat((Math.random() * 0.9 + 0.1).toFixed(4)),
          rank: 0, // Will be calculated below
        }));

        // Sort by score in descending order
        mockFeatureScores.sort((a, b) => b.score - a.score);

        // Add rank
        mockFeatureScores.forEach((feature, index) => {
          feature.rank = index + 1;
        });

        // Only keep top N features based on user selection
        const topFeatures = mockFeatureScores.slice(0, numberOfFeatures);

        // Create visualizations data
        const barChartData = {
          x: topFeatures.map((f) => f.feature),
          y: topFeatures.map((f) => f.score),
          type: "bar",
          marker: {
            color: topFeatures.map(
              (_, i) =>
                `rgba(55, 128, 191, ${1 - (i * 0.7) / topFeatures.length})`
            ),
          },
        };

        setResults({
          method: {
            category: selectionMethod,
            specific: specificMethod,
            name: methods[selectionMethod].find((m) => m.id === specificMethod)
              ?.name,
          },
          allFeatures: mockFeatureScores,
          selectedFeatures: topFeatures,
          visualizations: {
            barChart: barChartData,
          },
          executionTime: "1.23s (mock)",
        });

        setStatus("success");
        setErrorMessage("Using mock data for demonstration");
      }
    } finally {
      setIsProcessing(false);
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
          <FiFilter className="mr-2 text-indigo-500" /> Feature Selection
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Identify and select the most important features to improve model
          performance and reduce overfitting.
        </p>
      </div>

      {/* Dataset Selector */}
      <DatasetSelector
        onSelect={handleDatasetSelect}
        selectedDatasetId={datasetId || undefined}
      />

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
            {errorMessage || "Feature selection completed successfully!"}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <FiSettings className="mr-2 text-indigo-500" /> Selection Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="method-category"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Method Category
                </label>
                <select
                  id="method-category"
                  value={selectionMethod}
                  onChange={handleMethodCategoryChange}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="filter">Filter Methods</option>
                  <option value="wrapper">Wrapper Methods</option>
                  <option value="embedded">Embedded Methods</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectionMethod === "filter" &&
                    "Filter methods select features based on statistical measures, independent of any model."}
                  {selectionMethod === "wrapper" &&
                    "Wrapper methods use a predictive model to score feature subsets and select the best performing features."}
                  {selectionMethod === "embedded" &&
                    "Embedded methods perform feature selection as part of the model construction process."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="specific-method"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Specific Method
                </label>
                <select
                  id="specific-method"
                  value={specificMethod}
                  onChange={handleSpecificMethodChange}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {methods[selectionMethod].map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {
                    methods[selectionMethod].find(
                      (m) => m.id === specificMethod
                    )?.description
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <FiBarChart2 className="mr-2 text-indigo-500" /> Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="target-column"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Target Column
                </label>
                <select
                  id="target-column"
                  value={targetColumn}
                  onChange={handleTargetChange}
                  disabled={isProcessing || columns.length === 0}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select target column</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The target variable you want to predict
                </p>
              </div>

              <div>
                <label
                  htmlFor="feature-count"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Number of features to select
                </label>
                <input
                  type="number"
                  id="feature-count"
                  min="1"
                  max={selectedColumns.length}
                  value={numberOfFeatures}
                  onChange={handleNumberOfFeaturesChange}
                  disabled={isProcessing || selectedColumns.length === 0}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  How many top features to include in the final selection
                </p>
              </div>
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
                {selectedColumns.length ===
                columns.filter((col) => col !== targetColumn).length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columns
                .filter((column) => column !== targetColumn)
                .map((column) => (
                  <div
                    key={column}
                    className={`relative flex items-center p-3 rounded-md cursor-pointer transition-all border
                      ${
                        selectedColumns.includes(column)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    onClick={() => handleFeatureToggle(column)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={() => handleFeatureToggle(column)}
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
                No columns found. Please upload a valid dataset first.
              </div>
            )}
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
              "Run Feature Selection"
            )}
          </motion.button>
        </form>

        {results && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Feature Selection Results
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Method: {results.method.name} | Execution Time:{" "}
                {results.executionTime}
              </p>
            </div>

            <div className="p-5">
              {/* Top features */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Top {results.selectedFeatures.length} Features
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Feature
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Importance Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {results.selectedFeatures.map(
                        (feature: any, idx: number) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800/50"
                            }
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {feature.rank}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                              {feature.feature}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="mr-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                  <div
                                    className="bg-indigo-500 h-2.5 rounded-full"
                                    style={{ width: `${feature.score * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {feature.score.toFixed(4)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visualization */}
              <div className="mb-8 overflow-hidden">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Feature Importance Visualization
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                  <Plot
                    data={[
                      {
                        ...results.visualizations.barChart,
                        marker: {
                          color: results.selectedFeatures.map(
                            (_, i) =>
                              `rgba(99, 102, 241, ${
                                1 - (i * 0.7) / results.selectedFeatures.length
                              })`
                          ),
                        },
                      },
                    ]}
                    layout={{
                      title: "Feature Importance Scores",
                      margin: { l: 50, r: 50, b: 100, t: 50, pad: 4 },
                      xaxis: {
                        title: "Features",
                        tickangle: -45,
                      },
                      yaxis: {
                        title: "Importance Score",
                      },
                      autosize: true,
                      paper_bgcolor: "transparent",
                      plot_bgcolor: "transparent",
                      font: {
                        color: "rgb(156, 163, 175)",
                      },
                    }}
                    config={{ responsive: true }}
                    style={{ width: "100%", height: "400px" }}
                    className="dark:text-gray-300"
                  />
                </div>
              </div>

              {/* All features table */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Complete Feature Ranking
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Feature
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Importance Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {results.allFeatures.map((feature: any, idx: number) => (
                        <tr
                          key={idx}
                          className={`${
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50 dark:bg-gray-800/50"
                          } 
                            ${idx < numberOfFeatures ? "font-medium" : ""}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {feature.rank}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {feature.feature}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {feature.score.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FeatureSelection;
