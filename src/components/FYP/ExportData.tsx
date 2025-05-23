import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiDownload,
  FiSettings,
  FiColumns,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import DatasetSelector from "./DatasetSelector";

const ExportData: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "json">(
    "csv"
  );
  const [includeColumns, setIncludeColumns] = useState<string[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [exportName, setExportName] = useState<string>("processed_data");
  const [compressionType, setCompressionType] = useState<
    "none" | "zip" | "gzip"
  >("none");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [delimiter, setDelimiter] = useState<string>(",");
  const [exportSubset, setExportSubset] = useState<
    "all" | "training" | "testing" | "validation"
  >("all");
  const [datasetId, setDatasetId] = useState<string>("");

  // Fetch columns for the selected dataset
  const fetchColumns = async (selectedDatasetId: string) => {
    try {
      const response = await axios.get("http://localhost:5000/ml/columns", {
        params: { datasetId: selectedDatasetId },
      });

      if (response.data.success) {
        setAllColumns(response.data.columns);
        setIncludeColumns(response.data.columns); // Default to all columns selected
      } else {
        setStatus("error");
        setMessage("Failed to fetch columns");
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
      setStatus("error");
      setMessage("Failed to connect to the server");

      // Fallback to mock columns
      const mockColumns = [
        "id",
        "age",
        "income",
        "education",
        "gender",
        "occupation",
        "spending",
        "savings",
        "satisfaction",
        "target",
      ];
      setAllColumns(mockColumns);
      setIncludeColumns(mockColumns);
    }
  };

  // Handle dataset selection
  const handleDatasetSelect = (selectedDatasetId: string) => {
    setDatasetId(selectedDatasetId);
    fetchColumns(selectedDatasetId);
  };

  // Toggle checkbox for column selection
  const handleColumnToggle = (column: string) => {
    setIncludeColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((col) => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Select or deselect all columns
  const handleToggleAllColumns = () => {
    if (includeColumns.length === allColumns.length) {
      setIncludeColumns([]);
    } else {
      setIncludeColumns([...allColumns]);
    }
  };

  // Handle format change
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportFormat(e.target.value as "csv" | "excel" | "json");
  };

  // Handle export name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportName(e.target.value);
  };

  // Handle compression type change
  const handleCompressionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompressionType(e.target.value as "none" | "zip" | "gzip");
  };

  // Handle delimiter change
  const handleDelimiterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDelimiter(e.target.value);
  };

  // Handle data subset change
  const handleSubsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportSubset(
      e.target.value as "all" | "training" | "testing" | "validation"
    );
  };

  // Handle export action
  const handleExport = async () => {
    if (includeColumns.length === 0) {
      setMessage("Please select at least one column to export");
      setStatus("error");
      return;
    }

    if (!datasetId) {
      setMessage("Please select a dataset first");
      setStatus("error");
      return;
    }

    setIsExporting(true);
    setMessage("Preparing export...");
    setStatus("idle");

    try {
      // Get the actual data from the server
      const response = await axios.get("http://localhost:5000/ml/export", {
        params: {
          datasetId,
          columns: includeColumns,
          format: exportFormat,
        },
      });

      if (response.data && response.data.success) {
        // Create a CSV/JSON string for download
        let contentType = "text/csv;charset=utf-8;";
        let fileExtension = ".csv";
        let content = "";

        if (exportFormat === "json") {
          contentType = "application/json;charset=utf-8;";
          fileExtension = ".json";
          content = JSON.stringify(response.data.dataset, null, 2);
        } else {
          // CSV format
          const headers = response.data.headers.join(delimiter);
          const rows = response.data.dataset.map((row: any) =>
            response.data.headers
              .map((header: string) => row[header])
              .join(delimiter)
          );
          content = [headers, ...rows].join("\n");
        }

        // Apply compression (in a real app this would be done on the server)
        if (compressionType !== "none") {
          fileExtension += compressionType === "zip" ? ".zip" : ".gz";
        }

        // Create and trigger the download
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${exportName}${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage(
          `Data successfully exported to ${exportName}${fileExtension}`
        );
        setStatus("success");
      } else {
        throw new Error(response.data?.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      setMessage("An error occurred during export. Please try again.");
      setStatus("error");
    } finally {
      setIsExporting(false);
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
          <FiDownload className="mr-2 text-indigo-500" /> Export Data
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Export your processed data in various formats for further analysis or
          reporting.
        </p>
      </div>

      {/* Dataset Selector */}
      <DatasetSelector
        onSelect={handleDatasetSelect}
        selectedDatasetId={datasetId || undefined}
      />

      <div className="space-y-8">
        {message && status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {message}
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            {message}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExport();
          }}
        >
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <FiSettings className="mr-2 text-indigo-500" /> Export Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="export-format"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Export Format
                </label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={handleFormatChange}
                  disabled={isExporting}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="csv">CSV (Comma Separated Values)</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="json">
                    JSON (JavaScript Object Notation)
                  </option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose the file format for your exported data
                </p>
              </div>

              <div>
                <label
                  htmlFor="export-name"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Filename
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="export-name"
                    value={exportName}
                    onChange={handleNameChange}
                    disabled={isExporting}
                    placeholder="Enter filename without extension"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-r-md">
                    .{exportFormat}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Name for your exported file (without extension)
                </p>
              </div>

              <div>
                <label
                  htmlFor="export-subset"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Data Subset
                </label>
                <select
                  id="export-subset"
                  value={exportSubset}
                  onChange={handleSubsetChange}
                  disabled={isExporting}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Complete Dataset</option>
                  <option value="training">Training Set Only</option>
                  <option value="testing">Testing Set Only</option>
                  <option value="validation">Validation Set Only</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select which portion of your split data to export
                </p>
              </div>

              <div>
                <label
                  htmlFor="compression-type"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Compression
                </label>
                <select
                  id="compression-type"
                  value={compressionType}
                  onChange={handleCompressionChange}
                  disabled={isExporting}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="zip">ZIP</option>
                  <option value="gzip">GZIP</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Optional compression to reduce file size
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
              >
                {showAdvanced ? (
                  <FiChevronUp className="mr-1" />
                ) : (
                  <FiChevronDown className="mr-1" />
                )}
                {showAdvanced
                  ? "Hide Advanced Options"
                  : "Show Advanced Options"}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="delimiter"
                      className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >
                      CSV Delimiter
                    </label>
                    <select
                      id="delimiter"
                      value={delimiter}
                      onChange={handleDelimiterChange}
                      disabled={isExporting || exportFormat !== "csv"}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="\t">Tab</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Character used to separate values in CSV format
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Additional Options
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="include-header"
                          checked={true}
                          disabled={isExporting}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="include-header"
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include header row
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="include-index"
                          disabled={isExporting}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="include-index"
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include row index
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FiColumns className="mr-2 text-indigo-500" /> Select Columns
              </h3>
              <button
                type="button"
                onClick={handleToggleAllColumns}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
              >
                {includeColumns.length === allColumns.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allColumns.map((column) => (
                <div
                  key={column}
                  className={`relative flex items-center p-3 rounded-md cursor-pointer transition-all border
                    ${
                      includeColumns.includes(column)
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  onClick={() => handleColumnToggle(column)}
                >
                  <input
                    type="checkbox"
                    checked={includeColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                    disabled={isExporting}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {column}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-300
                      ${
                        isExporting
                          ? "bg-indigo-600/80"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } 
                      ${
                        includeColumns.length === 0
                          ? "opacity-60 cursor-not-allowed"
                          : "shadow-md hover:shadow-lg"
                      }`}
            disabled={isExporting || includeColumns.length === 0}
            whileHover={{ scale: isExporting ? 1 : 1.02 }}
            whileTap={{ scale: isExporting ? 1 : 0.98 }}
          >
            {isExporting ? (
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
                Preparing Download...
              </>
            ) : (
              <>
                <FiDownload className="mr-2" /> Export Data
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ExportData;
