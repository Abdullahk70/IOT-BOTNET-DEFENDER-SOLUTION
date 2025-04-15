import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiDatabase, FiRefreshCw, FiAlertCircle } from "react-icons/fi";

interface Dataset {
  _id: string;
  filename: string;
  originalname: string;
  uploadedAt: string;
  processed: boolean;
  size: number;
}

interface DatasetSelectorProps {
  onSelect: (datasetId: string) => void;
  selectedDatasetId?: string;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  onSelect,
  selectedDatasetId,
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(
    selectedDatasetId || null
  );

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    // If a dataset ID is passed as a prop, update the current selection
    if (selectedDatasetId) {
      setCurrentDatasetId(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://localhost:5000/ml/datasets");

      if (response.data && response.data.datasets) {
        setDatasets(response.data.datasets);

        // If we don't have a selected dataset but there are datasets available
        if (!currentDatasetId && response.data.datasets.length > 0) {
          // Try to get from localStorage first
          const storedId = localStorage.getItem("currentDatasetId");

          if (
            storedId &&
            response.data.datasets.some((d: Dataset) => d._id === storedId)
          ) {
            setCurrentDatasetId(storedId);
            onSelect(storedId);
          } else {
            // Otherwise use the most recent dataset
            const mostRecent = response.data.datasets[0];
            setCurrentDatasetId(mostRecent._id);
            onSelect(mostRecent._id);
            localStorage.setItem("currentDatasetId", mostRecent._id);
          }
        }
      } else {
        setDatasets([]);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
      setError("Failed to fetch datasets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataset = (datasetId: string) => {
    setCurrentDatasetId(datasetId);
    localStorage.setItem("currentDatasetId", datasetId);
    onSelect(datasetId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <FiDatabase className="mr-2 text-indigo-500" /> Select Dataset
        </h3>
        <button
          onClick={fetchDatasets}
          className="text-indigo-500 hover:text-indigo-600 p-1"
          title="Refresh datasets"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 flex items-center">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          Loading datasets...
        </div>
      ) : datasets.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          No datasets available. Please upload a dataset first.
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {datasets.map((dataset) => (
            <motion.div
              key={dataset._id}
              className={`border p-3 rounded-lg cursor-pointer transition-all ${
                currentDatasetId === dataset._id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
              }`}
              onClick={() => handleSelectDataset(dataset._id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between">
                <div className="font-medium text-gray-800 dark:text-gray-200 truncate pr-3">
                  {dataset.originalname}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatFileSize(dataset.size)}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(dataset.uploadedAt)}
              </div>
              {dataset.processed && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Processed
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
