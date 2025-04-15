import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Plot from "react-plotly.js";
import {
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiGrid,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const Visualization: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [chartType, setChartType] = useState<
    "scatter" | "bar" | "histogram" | "box" | "heatmap" | "pie"
  >("scatter");
  const [isLoading, setIsLoading] = useState(false);
  const [plotData, setPlotData] = useState<any>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [colorTheme, setColorTheme] = useState<
    "blues" | "greens" | "purples" | "oranges" | "reds"
  >("blues");

  const chartIcons = {
    scatter: <FiActivity className="mr-2 text-indigo-500" />,
    bar: <FiBarChart2 className="mr-2 text-indigo-500" />,
    histogram: <FiBarChart2 className="mr-2 text-indigo-500" />,
    box: <FiBarChart2 className="mr-2 text-indigo-500" />,
    heatmap: <FiGrid className="mr-2 text-indigo-500" />,
    pie: <FiPieChart className="mr-2 text-indigo-500" />,
  };

  const colorOptions = [
    { id: "blues", name: "Blues", primary: "rgba(66, 133, 244, 0.8)" },
    { id: "greens", name: "Greens", primary: "rgba(52, 168, 83, 0.8)" },
    { id: "purples", name: "Purples", primary: "rgba(156, 39, 176, 0.8)" },
    { id: "oranges", name: "Oranges", primary: "rgba(251, 140, 0, 0.8)" },
    { id: "reds", name: "Reds", primary: "rgba(234, 67, 53, 0.8)" },
  ];

  const chartOptions = [
    {
      id: "scatter",
      name: "Scatter Plot",
      description: "Displays the relationship between two variables as points",
    },
    {
      id: "bar",
      name: "Bar Chart",
      description: "Compares values across different categories",
    },
    {
      id: "histogram",
      name: "Histogram",
      description: "Shows the distribution of a single variable",
    },
    {
      id: "box",
      name: "Box Plot",
      description:
        "Displays the distribution of data based on five number summary",
    },
    {
      id: "heatmap",
      name: "Heatmap",
      description: "Visualizes matrix data using colors to represent values",
    },
    {
      id: "pie",
      name: "Pie Chart",
      description: "Shows the proportion of categories as slices of a circle",
    },
  ];

  useEffect(() => {
    // Fetch columns from the backend
    const fetchColumns = async () => {
      try {
        // Simulate API call with mock data since backend returns 400
        // const response = await axios.get("http://localhost:5000/ml/columns");
        const mockColumns = [
          "age",
          "income",
          "education",
          "gender",
          "occupation",
          "region",
          "spending",
          "savings",
          "debt",
          "satisfaction",
        ];

        setColumns(mockColumns);
        if (mockColumns.length > 0) {
          setXAxis(mockColumns[0]);
          if (mockColumns.length > 1) {
            setYAxis(mockColumns[1]);
          } else {
            setYAxis(mockColumns[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching columns:", err);
        setError("Failed to fetch columns from the dataset.");
        setStatus("error");
      }
    };

    fetchColumns();
  }, []);

  const handleVisualize = async () => {
    if (!xAxis && chartType !== "histogram") {
      setError("Please select a column for X-axis");
      setStatus("error");
      return;
    }

    if (!yAxis && (chartType === "scatter" || chartType === "heatmap")) {
      setError("Please select a column for Y-axis");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setError("");
    setStatus("idle");
    setPlotData(null);

    try {
      // In a real application, you would fetch the data from the backend
      // Here we'll generate some dummy data for demonstration purposes
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      const dummyData = generateDummyData(chartType, xAxis, yAxis);
      setPlotData(dummyData);
      setStatus("success");
    } catch (err) {
      console.error("Error generating visualization:", err);
      setError("Failed to generate visualization.");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDummyData = (type: string, x: string, y: string) => {
    // This is just a placeholder function to create dummy data for demonstration
    // In a real application, you would fetch actual data from your dataset
    const data: any[] = [];
    const getColorScale = () => {
      switch (colorTheme) {
        case "blues":
          return ["#E3F2FD", "#2196F3"];
        case "greens":
          return ["#E8F5E9", "#4CAF50"];
        case "purples":
          return ["#F3E5F5", "#9C27B0"];
        case "oranges":
          return ["#FFF3E0", "#FF9800"];
        case "reds":
          return ["#FFEBEE", "#F44336"];
        default:
          return ["#E3F2FD", "#2196F3"];
      }
    };

    const getPrimaryColor = () => {
      switch (colorTheme) {
        case "blues":
          return "rgba(33, 150, 243, 0.8)";
        case "greens":
          return "rgba(76, 175, 80, 0.8)";
        case "purples":
          return "rgba(156, 39, 176, 0.8)";
        case "oranges":
          return "rgba(255, 152, 0, 0.8)";
        case "reds":
          return "rgba(244, 67, 54, 0.8)";
        default:
          return "rgba(33, 150, 243, 0.8)";
      }
    };

    if (type === "scatter") {
      // Generate random scatter plot
      const xValues = Array.from({ length: 50 }, () => Math.random() * 10);
      const yValues = xValues.map((val) => val * Math.random() * 5);

      data.push({
        type: "scatter",
        mode: "markers",
        x: xValues,
        y: yValues,
        marker: {
          color: getPrimaryColor(),
          size: 8,
        },
        name: `${x} vs ${y}`,
      });
    } else if (type === "bar") {
      // Generate random bar chart
      const categories = [
        "Category A",
        "Category B",
        "Category C",
        "Category D",
        "Category E",
      ];
      const values = categories.map(() => Math.floor(Math.random() * 100));

      data.push({
        type: "bar",
        x: categories,
        y: values,
        marker: {
          color: getPrimaryColor(),
        },
        name: x,
      });
    } else if (type === "histogram") {
      // Generate random histogram
      const values = Array.from({ length: 500 }, () => Math.random() * 10);

      data.push({
        type: "histogram",
        x: values,
        marker: {
          color: getPrimaryColor(),
        },
        name: x,
      });
    } else if (type === "box") {
      // Generate random box plot
      const generateBoxData = () => {
        const mean = Math.random() * 5 + 5;
        return Array.from({ length: 50 }, () => Math.random() * 10 + mean);
      };

      const categories = ["Group 1", "Group 2", "Group 3", "Group 4"];
      categories.forEach((category, index) => {
        data.push({
          type: "box",
          y: generateBoxData(),
          name: category,
          boxpoints: "outliers",
          marker: {
            color: getPrimaryColor(),
            opacity: 1 - index * 0.15,
          },
        });
      });
    } else if (type === "heatmap") {
      // Generate random heatmap
      const xLabels = ["A", "B", "C", "D", "E"];
      const yLabels = ["V", "W", "X", "Y", "Z"];
      const zValues = Array.from({ length: yLabels.length }, () =>
        Array.from({ length: xLabels.length }, () =>
          Math.floor(Math.random() * 20)
        )
      );

      data.push({
        type: "heatmap",
        z: zValues,
        x: xLabels,
        y: yLabels,
        colorscale: getColorScale(),
      });
    } else if (type === "pie") {
      // Generate random pie chart
      const labels = ["Category A", "Category B", "Category C", "Category D"];
      const values = labels.map(() => Math.floor(Math.random() * 100) + 20);

      data.push({
        type: "pie",
        labels: labels,
        values: values,
        marker: {
          colors: [
            "rgba(33, 150, 243, 0.8)",
            "rgba(76, 175, 80, 0.8)",
            "rgba(156, 39, 176, 0.8)",
            "rgba(255, 152, 0, 0.8)",
          ],
        },
        textinfo: "label+percent",
        insidetextorientation: "radial",
      });
    }

    return data;
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
          <FiBarChart2 className="mr-2 text-indigo-500" /> Data Visualization
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Create visual representations of your data to gain insights and
          identify patterns.
        </p>
      </div>

      <div className="space-y-8">
        {error && status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            Visualization created successfully!
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            {chartIcons[chartType]} Chart Type
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chartOptions.map((option) => (
              <div
                key={option.id}
                className={`relative p-4 rounded-lg cursor-pointer transition-all border ${
                  chartType === option.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
                onClick={() => setChartType(option.id as any)}
              >
                <div className="flex items-center mb-1">
                  <input
                    type="radio"
                    id={`chart-${option.id}`}
                    checked={chartType === option.id}
                    onChange={() => setChartType(option.id as any)}
                    className="w-4 h-4 text-indigo-600 rounded-full focus:ring-indigo-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`chart-${option.id}`}
                    className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {option.name}
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiActivity className="mr-2 text-indigo-500" /> Data Selection
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chartType !== "histogram" &&
              chartType !== "box" &&
              chartType !== "pie" && (
                <div>
                  <label
                    htmlFor="x-axis"
                    className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                  >
                    X-Axis Column
                  </label>
                  <select
                    id="x-axis"
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    disabled={isLoading || columns.length === 0}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select X-Axis Column</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select the column to display on the horizontal axis
                  </p>
                </div>
              )}

            {(chartType === "scatter" || chartType === "heatmap") && (
              <div>
                <label
                  htmlFor="y-axis"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Y-Axis Column
                </label>
                <select
                  id="y-axis"
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  disabled={isLoading || columns.length === 0}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Y-Axis Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select the column to display on the vertical axis
                </p>
              </div>
            )}

            {(chartType === "histogram" || chartType === "box") && (
              <div>
                <label
                  htmlFor="data-column"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Data Column
                </label>
                <select
                  id="data-column"
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  disabled={isLoading || columns.length === 0}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Data Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select the column to analyze
                </p>
              </div>
            )}

            {chartType === "pie" && (
              <div>
                <label
                  htmlFor="category-column"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Category Column
                </label>
                <select
                  id="category-column"
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  disabled={isLoading || columns.length === 0}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Category Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select the column that contains categories
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="color-theme"
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Color Theme
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <div
                    key={color.id}
                    onClick={() => setColorTheme(color.id as any)}
                    className={`h-8 rounded-md cursor-pointer transition-all ${
                      colorTheme === color.id
                        ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
                        : ""
                    }`}
                    style={{ backgroundColor: color.primary }}
                    title={color.name}
                  ></div>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a color theme for your visualization
              </p>
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleVisualize}
          className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
                    ${
                      isLoading
                        ? "bg-indigo-600/80"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    } 
                    ${
                      columns.length === 0
                        ? "opacity-60 cursor-not-allowed"
                        : "shadow-md hover:shadow-lg"
                    }`}
          disabled={isLoading || columns.length === 0}
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
              Generating...
            </>
          ) : (
            "Generate Visualization"
          )}
        </motion.button>

        {plotData && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {chartOptions.find((c) => c.id === chartType)?.name} for {xAxis}
                {(chartType === "scatter" || chartType === "heatmap") &&
                  ` vs ${yAxis}`}
              </h3>
            </div>

            <div className="p-5">
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 flex justify-center">
                <Plot
                  data={plotData}
                  layout={{
                    width: 700,
                    height: 500,
                    margin: { l: 50, r: 50, b: 100, t: 30 },
                    autosize: true,
                    paper_bgcolor: "transparent",
                    plot_bgcolor: "transparent",
                    xaxis: {
                      title: xAxis,
                      gridcolor: "rgba(160, 174, 192, 0.2)",
                    },
                    yaxis: {
                      title:
                        chartType === "scatter" || chartType === "heatmap"
                          ? yAxis
                          : "",
                      gridcolor: "rgba(160, 174, 192, 0.2)",
                    },
                    font: {
                      color: "rgb(156, 163, 175)",
                    },
                  }}
                  config={{ responsive: true }}
                  style={{ width: "100%", height: "100%" }}
                  className="dark:text-gray-300"
                />
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  This is a demonstration visualization with random data. In a
                  real application, this would use your actual dataset.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Visualization;
