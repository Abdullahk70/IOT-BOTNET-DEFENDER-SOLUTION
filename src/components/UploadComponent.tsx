import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

// Constants
const API_URL = 'http://localhost:5000';
const API_FALLBACK_URL = 'http://127.0.0.1:5000';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

interface UploadComponentProps {
  onFileProcessed: (fileName: string) => void;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ onFileProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(API_URL);

  // Check server connection on mount
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
          setApiBaseUrl(API_URL);
          return;
        }
      } catch (error) {
        console.log('Primary server connection failed, trying fallback URL');
      }

      try {
        const fallbackResponse = await fetch(`${API_FALLBACK_URL}/api/health`);
        if (fallbackResponse.ok) {
          setApiBaseUrl(API_FALLBACK_URL);
          return;
        }
      } catch (fallbackError) {
        console.error('Both server connections failed');
      }
    };

    checkServerConnection();
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset states
    setError(null);
    setProgress(0);
    setUploadComplete(false);
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds maximum limit (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        return;
      }
      
      setFile(file);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });
  
  // Handle file upload and processing
  const handleProcessFile = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Upload file
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 100);
          setProgress(progressPercent);
        }
      });
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            setUploadComplete(true);
            setUploading(false);
            setProcessing(true);
            
            // Start processing
            const fileName = file.name;
            const response = JSON.parse(xhr.responseText);
            
            // Process the file on the server
            fetch(`${apiBaseUrl}/api/process`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ filePath: response.path })
            });
            
            // Poll for processing completion
            const checkProcessingStatus = async () => {
              try {
                const statusResponse = await fetch(`${apiBaseUrl}/api/processing-status?filename=${encodeURIComponent(fileName)}`);
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'completed') {
                  setProcessing(false);
                  onFileProcessed(fileName);
                } else if (statusData.status === 'error') {
                  setProcessing(false);
                  setError(statusData.error || 'Processing failed');
                } else {
                  // Still processing, check again in 2 seconds
                  setTimeout(checkProcessingStatus, 2000);
                }
              } catch (error) {
                setProcessing(false);
                setError('Failed to check processing status');
                console.error('Error checking processing status:', error);
              }
            };
            
            setTimeout(checkProcessingStatus, 1000);
            
          } else {
            setUploading(false);
            setError(xhr.responseText || 'Upload failed');
          }
        }
      };
      
      xhr.open('POST', `${apiBaseUrl}/api/upload`, true);
      xhr.send(formData);
      
    } catch (error) {
      setUploading(false);
      setError('An error occurred during upload');
      console.error('Upload error:', error);
    }
  };
  
  // Clear selection
  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setProgress(0);
    setUploadComplete(false);
  };
  
  return (
    <div className="upload-component">
      <motion.div 
        className="upload-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-title">Upload Network Data</h2>
        <p className="section-description">
          Upload a CSV file containing network traffic data for analysis
        </p>
        
        {!file && (
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <div className="dropzone-icon">
                <FiUpload />
              </div>
              <p className="dropzone-text">
                {isDragActive
                  ? 'Drop the CSV file here...'
                  : 'Drag & drop a CSV file here, or click to select'}
              </p>
              <p className="dropzone-hint">
                Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        )}
        
        {file && (
          <motion.div 
            className="file-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {file.size < 1024 * 1024 
                  ? `${(file.size / 1024).toFixed(2)} KB` 
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              </span>
            </div>
            
            <button 
              className="file-remove-btn"
              onClick={handleClearFile}
              disabled={uploading || processing}
            >
              <FiX />
            </button>
          </motion.div>
        )}
        
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiAlertCircle /> {error}
          </motion.div>
        )}
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">Uploading: {progress}%</p>
          </div>
        )}
        
        {processing && (
          <div className="processing-indicator">
            <LoadingSpinner size="sm" text="Processing file..." />
          </div>
        )}
        
        {uploadComplete && (
          <motion.div 
            className="upload-complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FiCheckCircle /> Upload complete
          </motion.div>
        )}
        
        {file && !uploading && !processing && (
          <motion.div 
            className="upload-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <button 
              className="btn btn-primary"
              onClick={handleProcessFile}
              disabled={!file || uploading || processing}
            >
              Process File
            </button>
            <button 
              className="btn btn-outline"
              onClick={handleClearFile}
              disabled={uploading || processing}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadComponent; 