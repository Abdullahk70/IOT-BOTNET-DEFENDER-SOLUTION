import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Plot from "react-plotly.js";
import axios from "axios";
import {
  FiBarChart2,
  FiPieChart,
  FiSliders,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const DataSplitting: React.FC = () => {
  const [trainRatio, setTrainRatio] = useState(70);
  const [testRatio, setTestRatio] = useState(20);
  const [valRatio, setValRatio] = useState(10);
  const [splitRandomly, setSplitRandomly] = useState(true);
  const [stratify, setStratify] = useState(false);
  const [targetColumn, setTargetColumn] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitData, setSplitData] = useState<any>(null);

  // Colors for pie chart
  const colors = ["#4F6DF5", "#10B981", "#8B5CF6"];

  // Pie chart data
  const pieData = [
    { label: "Training", value: trainRatio, color: colors[0] },
    { label: "Testing", value: testRatio, color: colors[1] },
    { label: "Validation", value: valRatio, color: colors[2] },
  ];

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      // Simulating API call to fetch columns
      // In production, replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockColumns = [
        "target",
        "age",
        "gender",
        "income",
        "education",
        "occupation",
      ];
      setColumns(mockColumns);
      setTargetColumn(mockColumns[0]);
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  const validateRatios = () => {
    const sum = trainRatio + testRatio + valRatio;
    if (sum !== 100) {
      setErrorMessage("The sum of ratios must be 100%");
      setStatus("error");
      return false;
    }
    if (trainRatio < 10) {
      setErrorMessage("Training ratio must be at least 10%");
      setStatus("error");
      return false;
    }
    if (testRatio < 5) {
      setErrorMessage("Testing ratio must be at least 5%");
      setStatus("error");
      return false;
    }
    setErrorMessage("");
    setStatus("idle");
    return true;
  };

  const handleTrainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const oldTrain = trainRatio;

    if (newValue >= 10 && newValue <= 90) {
      const diff = newValue - oldTrain;
      setTrainRatio(newValue);

      // Adjust test ratio if possible, otherwise adjust val ratio
      if (testRatio - diff >= 5) {
        setTestRatio(testRatio - diff);
      } else {
        setTestRatio(5);
        setValRatio(Math.max(0, 100 - newValue - 5));
      }

      validateRatios();
    }
  };

  const handleTestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const oldTest = testRatio;

    if (newValue >= 5 && newValue <= 50) {
      const diff = newValue - oldTest;
      setTestRatio(newValue);

      // Adjust val ratio if possible, otherwise adjust train ratio
      if (valRatio - diff >= 0) {
        setValRatio(valRatio - diff);
      } else {
        setValRatio(0);
        setTrainRatio(Math.max(10, 100 - newValue));
      }

      validateRatios();
    }
  };

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const oldVal = valRatio;

    if (newValue >= 0 && newValue <= 30) {
      const diff = newValue - oldVal;
      setValRatio(newValue);

      // Adjust train ratio
      setTrainRatio(Math.max(10, 100 - newValue - testRatio));

      validateRatios();
    }
  };

  const handleRandomSplitChange = () => {
    setSplitRandomly(!splitRandomly);
  };

  const handleStratifyChange = () => {
    setStratify(!stratify);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetColumn(e.target.value);
  };

  const generateMockData = () => {
    const totalRows = 1000;
    const trainingRows = Math.floor((totalRows * trainRatio) / 100);
    const testingRows = Math.floor((totalRows * testRatio) / 100);
    const validationRows = totalRows - trainingRows - testingRows;

    // Generate mock data for each split
    return {
      training: Array.from({ length: trainingRows }, (_, i) => ({
        id: i,
        age: Math.floor(Math.random() * 80) + 18,
        income: Math.floor(Math.random() * 100000) + 20000,
        gender: Math.random() > 0.5 ? "Male" : "Female",
      })),
      testing: Array.from({ length: testingRows }, (_, i) => ({
        id: i,
        age: Math.floor(Math.random() * 80) + 18,
        income: Math.floor(Math.random() * 100000) + 20000,
        gender: Math.random() > 0.5 ? "Male" : "Female",
      })),
      validation: Array.from({ length: validationRows }, (_, i) => ({
        id: i,
        age: Math.floor(Math.random() * 80) + 18,
        income: Math.floor(Math.random() * 100000) + 20000,
        gender: Math.random() > 0.5 ? "Male" : "Female",
      })),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRatios()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulating API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock results
      const mockSplitData = generateMockData();
      setSplitData(mockSplitData);

      setStatus("success");
      setErrorMessage("Data split successfully!");
    } catch (error) {
      console.error("Error splitting data:", error);
      setStatus("error");
      setErrorMessage("An error occurred while splitting the data.");
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
          <FiPieChart className="mr-2 text-indigo-500" /> Data Splitting
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Split your dataset into training, validation, and test sets for model
          development and evaluation.
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-gray-200">
              Split Ratios (%)
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Adjust the sliders to set the proportions of your dataset splits.
            </p>

            <div className="flex flex-col lg:flex-row items-start gap-5">
              <div className="w-full lg:w-3/5 space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="train-ratio"
                    className="text-gray-700 dark:text-gray-300 flex justify-between"
                  >
                    <span>Training Data:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {trainRatio}%
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id="train-ratio"
                      min="10"
                      max="90"
                      value={trainRatio}
                      onChange={handleTrainChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      disabled={isProcessing}
                    />
                    <input
                      type="number"
                      value={trainRatio}
                      onChange={handleTrainChange}
                      min="10"
                      max="90"
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-center"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="test-ratio"
                    className="text-gray-700 dark:text-gray-300 flex justify-between"
                  >
                    <span>Testing Data:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {testRatio}%
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id="test-ratio"
                      min="5"
                      max="50"
                      value={testRatio}
                      onChange={handleTestChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      disabled={isProcessing}
                    />
                    <input
                      type="number"
                      value={testRatio}
                      onChange={handleTestChange}
                      min="5"
                      max="50"
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-center"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="val-ratio"
                    className="text-gray-700 dark:text-gray-300 flex justify-between"
                  >
                    <span>Validation Data:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {valRatio}%
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id="val-ratio"
                      min="0"
                      max="30"
                      value={valRatio}
                      onChange={handleValChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      disabled={isProcessing}
                    />
                    <input
                      type="number"
                      value={valRatio}
                      onChange={handleValChange}
                      min="0"
                      max="30"
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-center"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-2/5 flex justify-center mt-2">
                <Plot
                  data={[
                    {
                      values: pieData.map((slice) => slice.value),
                      labels: pieData.map((slice) => slice.label),
                      type: "pie",
                      hoverinfo: "label+percent",
                      textinfo: "percent",
                      marker: {
                        colors: pieData.map((slice) => slice.color),
                      },
                    },
                  ]}
                  layout={{
                    width: 300,
                    height: 300,
                    margin: { l: 0, r: 0, b: 0, t: 0 },
                    showlegend: true,
                    legend: { orientation: "h", y: -0.2 },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                  }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>

            {errorMessage && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg flex items-center ${
                  status === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                    : status === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                    : ""
                }`}
              >
                {status === "error" ? (
                  <FiAlertCircle className="mr-2 flex-shrink-0" />
                ) : (
                  <FiCheckCircle className="mr-2 flex-shrink-0" />
                )}
                {errorMessage}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Split Options
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="random-split"
                    checked={splitRandomly}
                    onChange={handleRandomSplitChange}
                    disabled={isProcessing}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label
                    htmlFor="random-split"
                    className="ml-2 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Split randomly
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                  Randomly shuffle the data before splitting. Disable for
                  time-series data or when order matters.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stratify"
                    checked={stratify}
                    onChange={handleStratifyChange}
                    disabled={isProcessing}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label
                    htmlFor="stratify"
                    className="ml-2 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Stratified split
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                  Maintain the same class distribution across all splits
                  (recommended for classification tasks).
                </p>

                {stratify && (
                  <div className="ml-6 mt-3">
                    <label
                      htmlFor="target-column"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Target column for stratification:
                    </label>
                    <select
                      id="target-column"
                      value={targetColumn}
                      onChange={handleTargetChange}
                      disabled={isProcessing || columns.length === 0}
                      className="w-full md:w-64 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {columns.length === 0 ? (
                        <option value="">No columns available</option>
                      ) : (
                        columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
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
                        errorMessage === "The sum of ratios must be 100%"
                          ? "opacity-60 cursor-not-allowed"
                          : "shadow-md hover:shadow-lg"
                      }`}
            disabled={
              isProcessing || errorMessage === "The sum of ratios must be 100%"
            }
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
              "Split Data"
            )}
          </motion.button>
        </form>

        {splitData && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
              Split Data Preview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                <div className="text-indigo-800 dark:text-indigo-300 font-semibold mb-1">
                  Training Set
                </div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {splitData.training.length}
                </div>
                <div className="text-sm font-medium text-indigo-500 dark:text-indigo-300">
                  {trainRatio}%
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
                <div className="text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                  Testing Set
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {splitData.testing.length}
                </div>
                <div className="text-sm font-medium text-emerald-500 dark:text-emerald-300">
                  {testRatio}%
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-purple-800 dark:text-purple-300 font-semibold mb-1">
                  Validation Set
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {splitData.validation.length}
                </div>
                <div className="text-sm font-medium text-purple-500 dark:text-purple-300">
                  {valRatio}%
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {["training", "testing", "validation"].map((setName, index) => (
                <div key={setName} className="overflow-hidden">
                  <h4
                    className={`text-lg font-semibold mb-3 ${
                      index === 0
                        ? "text-indigo-600 dark:text-indigo-400"
                        : index === 1
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {setName.charAt(0).toUpperCase() + setName.slice(1)} Set
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      (showing first 5 rows)
                    </span>
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {Object.keys(splitData[setName][0]).map((column) => (
                            <th
                              key={column}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {splitData[setName]
                          .slice(0, 5)
                          .map((row: any, index: number) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0
                                  ? "bg-white dark:bg-gray-900"
                                  : "bg-gray-50 dark:bg-gray-800/50"
                              }
                            >
                              {Object.values(row).map(
                                (value: any, i: number) => (
                                  <td
                                    key={i}
                                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    {typeof value === "number"
                                      ? Number.isInteger(value)
                                        ? value
                                        : value.toFixed(2)
                                      : String(value)}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DataSplitting;
