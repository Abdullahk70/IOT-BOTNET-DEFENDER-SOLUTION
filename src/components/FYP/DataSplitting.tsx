import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { FaInfoCircle } from "react-icons/fa";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import DatasetSelector from "./DatasetSelector";

interface DataSplittingProps {}

// Column type definition
interface Column {
  name: string;
  type: string;
}

// Split data definition
interface SplitData {
  train: number;
  test: number;
  validation: number;
}

const DataSplitting: React.FC<DataSplittingProps> = () => {
  // State for dataset selector
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for split ratios
  const [trainRatio, setTrainRatio] = useState<number>(0.7);
  const [testRatio, setTestRatio] = useState<number>(0.2);
  const [valRatio, setValRatio] = useState<number>(0.1);
  
  // State for advanced options
  const [randomState, setRandomState] = useState<number>(42);
  const [stratify, setStratify] = useState<boolean>(false);
  const [stratifyColumn, setStratifyColumn] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // State for result display
  const [splitResults, setSplitResults] = useState<any>(null);
  
  // Fetch columns when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      fetchColumns();
    } else {
      setColumns([]);
      setStratifyColumn("");
    }
  }, [selectedDataset]);
  
  // Fetch columns from the selected dataset
  const fetchColumns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/ml/columns?datasetId=${selectedDataset}`);
      
      if (response.data.success) {
        const columnsData = response.data.columns.map((col: any) => ({
          name: col.name,
          type: col.type,
        }));
        
        setColumns(columnsData);
      } else {
        setError(response.data.error || "Failed to fetch columns");
      }
    } catch (err: any) {
      console.error("Error fetching columns:", err);
      setError(err.message || "Failed to fetch columns");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for dataset change
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setSplitResults(null);
  };
  
  // Handle train ratio change
  const handleTrainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setTrainRatio(newValue);
    
    // Adjust test and validation ratios proportionally
    const remainingRatio = 1 - newValue;
    const currentNonTrainTotal = testRatio + valRatio;
    
    if (currentNonTrainTotal > 0) {
      // Maintain proportions of test and validation within the new remaining space
      const newTestRatio = (testRatio / currentNonTrainTotal) * remainingRatio;
      const newValRatio = (valRatio / currentNonTrainTotal) * remainingRatio;
      
      setTestRatio(parseFloat(newTestRatio.toFixed(2)));
      setValRatio(parseFloat(newValRatio.toFixed(2)));
    } else {
      // If both test and val are 0, assign all remaining to test
      setTestRatio(remainingRatio);
      setValRatio(0);
    }
  };
  
  // Handle test ratio change
  const handleTestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setTestRatio(newValue);
    
    // Adjust validation ratio to maintain sum of 1
    const newValRatio = Math.max(0, 1 - trainRatio - newValue);
    setValRatio(parseFloat(newValRatio.toFixed(2)));
  };
  
  // Handle validation ratio change
  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValRatio(newValue);
    
    // Adjust test ratio to maintain sum of 1
    const newTestRatio = Math.max(0, 1 - trainRatio - newValue);
    setTestRatio(parseFloat(newTestRatio.toFixed(2)));
  };
  
  // Validate that the split ratios sum to 1.0
  const validateRatios = (): boolean => {
    const sum = trainRatio + testRatio + valRatio;
    return Math.abs(sum - 1.0) < 0.001; // Allow for floating point imprecision
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDataset) {
      toast.error("Please select a dataset");
      return;
    }
    
    if (!validateRatios()) {
      toast.error("Split ratios must sum to 1.0");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const payload = {
        datasetId: selectedDataset,
        trainRatio,
        testRatio,
        validationRatio: valRatio,
        randomState,
        stratify,
        stratifyColumn: stratify ? stratifyColumn : undefined
      };
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ml/data-split`, payload);
      
      if (response.data.success) {
        setSplitResults(response.data);
        toast.success("Dataset split successfully!");
      } else {
        setError(response.data.error || "Failed to split dataset");
        toast.error(response.data.error || "Failed to split dataset");
      }
    } catch (err: any) {
      console.error("Error splitting dataset:", err);
      setError(err.response?.data?.error || err.message || "Failed to split dataset");
      toast.error(err.response?.data?.error || err.message || "Failed to split dataset");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate chart data for pie chart
  const getPieChartData = () => {
    const data = {
      labels: ['Training', 'Testing', valRatio > 0 ? 'Validation' : null].filter(Boolean),
      datasets: [
        {
          data: [trainRatio, testRatio, valRatio > 0 ? valRatio : null].filter(Boolean),
          backgroundColor: ['#2563EB', '#DC2626', '#10B981'],
          borderWidth: 0,
        },
      ],
    };
    return data;
  };
  
  // Get pie chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            return `${label}: ${(value * 100).toFixed(0)}%`;
          }
        }
      }
    },
  };
  
  // Generate split counts display from results
  const renderSplitCounts = () => {
    if (!splitResults) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-blue-800">Training Set</h3>
          <p className="text-blue-600 text-3xl font-bold">{splitResults.splits.train.count}</p>
          <p className="text-blue-600">({(splitResults.splits.train.ratio * 100).toFixed(0)}% of data)</p>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-red-800">Testing Set</h3>
          <p className="text-red-600 text-3xl font-bold">{splitResults.splits.test.count}</p>
          <p className="text-red-600">({(splitResults.splits.test.ratio * 100).toFixed(0)}% of data)</p>
        </div>
        
        {splitResults.splits.validation && (
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-green-800">Validation Set</h3>
            <p className="text-green-600 text-3xl font-bold">{splitResults.splits.validation.count}</p>
            <p className="text-green-600">({(splitResults.splits.validation.ratio * 100).toFixed(0)}% of data)</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render sample data preview from results
  const renderDataSamples = () => {
    if (!splitResults || !splitResults.train_samples || !splitResults.train_samples.length) return null;
    
    const trainSample = splitResults.train_samples[0];
    const testSample = splitResults.test_samples[0];
    const valSample = splitResults.validation_samples?.[0];
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Sample Data Preview</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="overflow-x-auto">
            <h4 className="text-md font-medium text-blue-800 mb-2">Training Set Sample</h4>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  {Object.keys(trainSample).map((key) => (
                    <th key={key} className="border-b border-gray-300 py-2 px-4 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.values(trainSample).map((value, index) => (
                    <td key={index} className="border-b border-gray-300 py-2 px-4">{String(value)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Determine if the form should be disabled
  const isFormDisabled = isLoading || !selectedDataset;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow p-6 max-w-7xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-4">Data Splitting</h2>
      <p className="text-gray-600 mb-6">
        Split your dataset into training, testing, and validation sets.
      </p>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <DatasetSelector onDatasetSelect={handleDatasetChange} />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Split Ratios</h3>
                <div className="text-sm text-gray-500">
                  <span className={validateRatios() ? "text-green-600" : "text-red-600"}>
                    Sum: {(trainRatio + testRatio + valRatio).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Train ratio slider */}
              <div className="mb-4">
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Training Set</label>
                  <span className="text-sm text-blue-600">{(trainRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={trainRatio}
                  onChange={handleTrainChange}
                  className="w-full mt-1 accent-blue-600"
                  disabled={isFormDisabled}
                />
              </div>
              
              {/* Test ratio slider */}
              <div className="mb-4">
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Testing Set</label>
                  <span className="text-sm text-red-600">{(testRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={testRatio}
                  onChange={handleTestChange}
                  className="w-full mt-1 accent-red-600"
                  disabled={isFormDisabled}
                />
              </div>
              
              {/* Validation ratio slider */}
              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Validation Set</label>
                  <span className="text-sm text-green-600">{(valRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={valRatio}
                  onChange={handleValChange}
                  className="w-full mt-1 accent-green-600"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
            
            {/* Advanced options toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                disabled={isFormDisabled}
              >
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </button>
              
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-gray-50 p-4 rounded-lg"
                >
                  {/* Random state input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Random State</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={randomState}
                        onChange={(e) => setRandomState(parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isFormDisabled}
                      />
                      <div className="ml-2 text-gray-500 cursor-pointer" title="Controls the randomness of the split. Use the same value to get the same split every time.">
                        <FaInfoCircle />
                      </div>
                    </div>
                  </div>
                  
                  {/* Stratify checkbox */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        id="stratify"
                        type="checkbox"
                        checked={stratify}
                        onChange={(e) => setStratify(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isFormDisabled}
                      />
                      <label htmlFor="stratify" className="ml-2 block text-sm text-gray-700">
                        Use Stratified Split
                      </label>
                      <div className="ml-2 text-gray-500 cursor-pointer" title="Maintains the same proportion of target values in all subsets">
                        <FaInfoCircle />
                      </div>
                    </div>
                  </div>
                  
                  {/* Stratify column select */}
                  {stratify && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stratify by Column
                      </label>
                      <select
                        value={stratifyColumn}
                        onChange={(e) => setStratifyColumn(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isFormDisabled || columns.length === 0}
                      >
                        <option value="">Select a column</option>
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            
            <button
              type="submit"
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isFormDisabled}
            >
              {isLoading ? "Processing..." : "Split Data"}
            </button>
          </form>
        </div>
        
        <div>
          <div className="bg-gray-50 p-6 rounded-lg h-full">
            <h3 className="text-lg font-medium mb-6">Preview</h3>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-64 h-64 mb-6">
                <Pie data={getPieChartData()} options={pieChartOptions} />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Your dataset will be split into{" "}
                  <span className="font-medium text-blue-600">{(trainRatio * 100).toFixed(0)}% training</span>,{" "}
                  <span className="font-medium text-red-600">{(testRatio * 100).toFixed(0)}% testing</span>
                  {valRatio > 0 && (
                    <span>
                      , and{" "}
                      <span className="font-medium text-green-600">{(valRatio * 100).toFixed(0)}% validation</span>
                    </span>
                  )}.
                </p>
                
                {stratify && stratifyColumn && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      Using stratified sampling on column <strong>{stratifyColumn}</strong> to maintain class distribution across all sets.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Display results */}
      {splitResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 bg-gray-50 p-6 rounded-lg"
        >
          <h3 className="text-xl font-medium mb-4">Results</h3>
          
          {renderSplitCounts()}
          
          <div className="mt-6 mb-2">
            <h3 className="text-lg font-medium">Created Datasets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {splitResults.datasets.map((dataset: any) => (
                <div key={dataset.type} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-medium capitalize">
                    {dataset.type} Dataset
                  </h4>
                  <p className="text-gray-600">ID: {dataset.datasetId}</p>
                  <p className="text-gray-600">Rows: {dataset.count}</p>
                </div>
              ))}
            </div>
          </div>
          
          {renderDataSamples()}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DataSplitting;
