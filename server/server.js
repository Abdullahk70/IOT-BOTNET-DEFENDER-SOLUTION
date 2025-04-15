const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const { spawn } = require("child_process");
const mongoose = require("mongoose");

// Import routes
const authRoutes = require("./routes/auth");

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://abdullah:123@cluster0.qfbdxft.mongodb.net/")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit
  },
});

// Configure CORS
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/images", express.static(imagesDir));

// Create a router for ML routes
const mlRouter = express.Router();

// Define Dataset schema if it doesn't exist yet
const DatasetSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  columns: [String],
  processed: {
    type: Boolean,
    default: false,
  },
});

// Create model if it doesn't exist
const Dataset =
  mongoose.models.Dataset || mongoose.model("Dataset", DatasetSchema);

// ML route for file upload
mlRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    };

    // Read file headers to get columns
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const lines = fileContent.split("\n");
    let columns = [];

    if (lines.length > 0) {
      columns = lines[0]
        .split(",")
        .map((header) => header.trim().replace(/^"|"$/g, ""));
    }

    // Save to MongoDB
    const dataset = new Dataset({
      ...fileInfo,
      columns,
      // If authentication is implemented, add user reference
      // uploadedBy: req.user._id
    });

    await dataset.save();

    console.log("[INFO] ML file uploaded and saved to database:", fileInfo);
    res.status(200).json({
      success: true,
      file: fileInfo,
      datasetId: dataset._id,
    });
  } catch (error) {
    console.error("[ERROR] ML upload failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ML route for columns
mlRouter.get("/columns", async (req, res) => {
  try {
    const { filePath, datasetId } = req.query;

    // If datasetId is provided, get columns from database
    if (datasetId) {
      const dataset = await Dataset.findById(datasetId);
      if (dataset) {
        return res.status(200).json({
          success: true,
          columns: dataset.columns,
        });
      }
    }

    if (!filePath && filePath !== "") {
      // When no file data is provided, check for the most recent dataset
      const latestDataset = await Dataset.findOne().sort({ uploadedAt: -1 });

      if (latestDataset) {
        return res.status(200).json({
          success: true,
          columns: latestDataset.columns,
          datasetId: latestDataset._id,
        });
      }

      // If no datasets exist, return mock data for demo purposes
      console.log("[INFO] No datasets found, returning mock columns");
      return res.status(200).json({
        success: true,
        columns: [
          "age",
          "income",
          "gender",
          "location",
          "education",
          "score",
          "target",
        ],
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file path or file does not exist",
      });
    }

    // Read the first line of the CSV to get headers
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n");

    if (lines.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Empty CSV file",
      });
    }

    // Get headers from first line
    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().replace(/^"|"$/g, ""));

    res.status(200).json({
      success: true,
      columns: headers,
    });
  } catch (error) {
    console.error("[ERROR] Failed to read CSV headers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read CSV headers: " + error.message,
    });
  }
});

// ML route for retrieve dataset
mlRouter.get("/retrieve", async (req, res) => {
  try {
    const { datasetId, limit = 10, normalized = false } = req.query;

    if (datasetId) {
      // First try to find the specific dataset
      const dataset = await Dataset.findById(datasetId);

      if (dataset && fs.existsSync(dataset.path)) {
        // Read CSV file
        const fileContent = fs.readFileSync(dataset.path, "utf8");
        const lines = fileContent.split("\n");

        if (lines.length <= 1) {
          return res.status(400).json({
            success: false,
            error: "Dataset is empty",
          });
        }

        // Get headers
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/^"|"$/g, ""));

        // Get data (limited to requested amount)
        const data = [];
        const rowsToRead = Math.min(parseInt(limit) || 10, lines.length - 1);

        for (let i = 1; i <= rowsToRead; i++) {
          if (lines[i].trim()) {
            const values = lines[i]
              .split(",")
              .map((v) => v.trim().replace(/^"|"$/g, ""));
            const row = {};

            headers.forEach((header, index) => {
              // Try to convert to number when appropriate
              const value = values[index];
              row[header] =
                !isNaN(value) && value !== "" ? parseFloat(value) : value;
            });

            data.push(row);
          }
        }

        return res.status(200).json(data);
      }

      // If normalized is true and the specific dataset wasn't found, try to find a processed version
      if (normalized === "true" || normalized === true) {
        // Look for a normalized version of this dataset
        const normalizedDataset = await Dataset.findOne({
          originalname: {
            $regex: `normalized_.*_${dataset?.originalname || ""}`,
          },
          processed: true,
        }).sort({ uploadedAt: -1 });

        if (normalizedDataset && fs.existsSync(normalizedDataset.path)) {
          // Read CSV file
          const fileContent = fs.readFileSync(normalizedDataset.path, "utf8");
          const lines = fileContent.split("\n");

          if (lines.length <= 1) {
            return res.status(400).json({
              success: false,
              error: "Normalized dataset is empty",
            });
          }

          // Get headers
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/^"|"$/g, ""));

          // Get data (limited to requested amount)
          const data = [];
          const rowsToRead = Math.min(parseInt(limit) || 10, lines.length - 1);

          for (let i = 1; i <= rowsToRead; i++) {
            if (lines[i].trim()) {
              const values = lines[i]
                .split(",")
                .map((v) => v.trim().replace(/^"|"$/g, ""));
              const row = {};

              headers.forEach((header, index) => {
                // Try to convert to number when appropriate
                const value = values[index];
                row[header] =
                  !isNaN(value) && value !== "" ? parseFloat(value) : value;
              });

              data.push(row);
            }
          }

          return res.status(200).json(data);
        }
      }
    }

    // If no dataset was found or accessible, return mock data
    console.log("[INFO] No valid dataset found, returning mock data");
    const mockData = [];
    // Generate mock data rows
    for (let i = 0; i < 10; i++) {
      mockData.push({
        id: i + 1,
        age: Math.floor(Math.random() * 50) + 20,
        income: Math.floor(Math.random() * 100000) + 30000,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        location: ["New York", "London", "Tokyo", "Paris", "Berlin"][
          Math.floor(Math.random() * 5)
        ],
        education: ["High School", "Bachelor", "Master", "PhD"][
          Math.floor(Math.random() * 4)
        ],
        score: (Math.random() * 100).toFixed(2),
        target: Math.random() > 0.7 ? 1 : 0,
      });
    }

    res.status(200).json(mockData);
  } catch (error) {
    console.error("[ERROR] Failed to retrieve dataset:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dataset: " + error.message,
    });
  }
});

// ML route for export dataset
mlRouter.get("/export", async (req, res) => {
  try {
    const {
      datasetId,
      format = "csv",
      includeColumns = [],
      subset = "all",
    } = req.query;

    // Find the dataset in the database
    if (!datasetId) {
      // Return mock data if no dataset is provided
      const headers = [
        "id",
        "age",
        "income",
        "gender",
        "location",
        "education",
        "score",
        "target",
      ];
      const mockData = [];

      // Generate 10 rows of mock data
      for (let i = 0; i < 10; i++) {
        mockData.push({
          id: i + 1,
          age: Math.floor(Math.random() * 50) + 20,
          income: Math.floor(Math.random() * 100000) + 30000,
          gender: Math.random() > 0.5 ? "Male" : "Female",
          location: ["New York", "London", "Tokyo", "Paris", "Berlin"][
            Math.floor(Math.random() * 5)
          ],
          education: ["High School", "Bachelor", "Master", "PhD"][
            Math.floor(Math.random() * 4)
          ],
          score: (Math.random() * 100).toFixed(2),
          target: Math.random() > 0.7 ? 1 : 0,
        });
      }

      return res.status(200).json({
        headers,
        dataset: mockData,
      });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: "Dataset not found",
      });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({
        success: false,
        error: "Dataset file not found",
      });
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(dataset.path, "utf8");
    const lines = fileContent.split("\n");

    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "Dataset is empty",
      });
    }

    // Get headers
    const allHeaders = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    // Filter columns if specified
    const headers =
      includeColumns.length > 0
        ? allHeaders.filter((h) => includeColumns.includes(h))
        : allHeaders;

    if (headers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid columns selected for export",
      });
    }

    // Get column indices
    const columnIndices = headers.map((h) => allHeaders.indexOf(h));

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""));

        if (values.length === allHeaders.length) {
          const row = {};
          headers.forEach((header, idx) => {
            const colIdx = columnIndices[idx];
            const value = values[colIdx];
            row[header] = isNaN(value) ? value : parseFloat(value);
          });
          rows.push(row);
        }
      }
    }

    res.status(200).json({
      success: true,
      headers,
      dataset: rows,
      totalRows: rows.length,
      format,
      datasetName: dataset.originalname,
    });
  } catch (error) {
    console.error("[ERROR] Failed to export dataset:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export dataset: " + error.message,
    });
  }
});

// ML route to get all available datasets
mlRouter.get("/datasets", async (req, res) => {
  try {
    // Get all datasets from the database, sorted by uploadedAt in descending order
    const datasets = await Dataset.find({})
      .sort({ uploadedAt: -1 })
      .select("filename originalname uploadedAt size processed columns")
      .lean();

    res.status(200).json({
      success: true,
      datasets,
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch datasets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch datasets: " + error.message,
    });
  }
});

// ML route for normalization
mlRouter.post("/normalize", async (req, res) => {
  try {
    const { columns, method, datasetId } = req.body;

    if (!columns || !method || !datasetId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: columns, method, and datasetId",
      });
    }

    console.log(`[INFO] Processing normalization using ${method}`);
    console.log(`[INFO] Selected columns: ${columns.join(", ")}`);

    // Find the dataset in the database
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: "Dataset not found",
      });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({
        success: false,
        error: "Dataset file not found",
      });
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(dataset.path, "utf8");
    const lines = fileContent.split("\n");

    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "Dataset is empty",
      });
    }

    // Get headers and validate requested columns
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const invalidColumns = columns.filter((col) => !headers.includes(col));
    if (invalidColumns.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid columns: ${invalidColumns.join(", ")}`,
      });
    }

    // Create a temporary directory for Python script execution
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a temporary CSV file with only the columns to normalize
    const tempCsvPath = path.join(tempDir, `normalization_${Date.now()}.csv`);

    // Extract needed column indices
    const columnIndices = columns.map((col) => headers.indexOf(col));

    // Write the CSV header
    let csvContent = columns.join(",") + "\n";

    // Extract and write data rows
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""));

        if (values.length === headers.length) {
          const selectedValues = columnIndices.map((idx) => values[idx]);
          csvContent += selectedValues.join(",") + "\n";
        }
      }
    }

    fs.writeFileSync(tempCsvPath, csvContent);

    // Prepare Python script for normalization
    const scriptContent = `
import pandas as pd
import numpy as np
import json
import sys
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, QuantileTransformer, PowerTransformer

# Load the data
data = pd.read_csv('${tempCsvPath.replace(/\\/g, "\\\\")}')

# Get normalization method
method = sys.argv[1]

# Initialize results dictionary
result = {
    'success': True,
    'method': method,
    'columns': data.columns.tolist(),
    'results': {}
}

# Helper function to get sample rows for before/after comparison
def get_sample_data(original_df, transformed_df, n=5):
    samples = []
    if len(original_df) > 0:
        # Get indices of sample rows
        sample_indices = np.linspace(0, len(original_df) - 1, min(n, len(original_df)), dtype=int)
        
        for idx in sample_indices:
            original_row = original_df.iloc[idx].to_dict()
            transformed_row = {}
            for col in transformed_df.columns:
                transformed_row[col] = float(transformed_df.iloc[idx][col])
            
            samples.append({
                'original': original_row,
                'transformed': transformed_row
            })
    
    return samples

# Calculate statistics for each column
column_stats = {}
for column in data.columns:
    col_data = data[column].dropna()
    if len(col_data) > 0 and pd.api.types.is_numeric_dtype(col_data):
        stats = {
            'min': float(col_data.min()),
            'max': float(col_data.max()),
            'mean': float(col_data.mean()),
            'median': float(col_data.median()),
            'std': float(col_data.std()),
            'count': int(len(col_data)),
            'missing': int(data[column].isna().sum())
        }
        column_stats[column] = stats
    else:
        # Skip non-numeric columns
        result['results'][column] = {
            'status': 'skipped',
            'reason': 'column is not numeric'
        }
        continue

# Apply the specified normalization method
try:
    # Make a copy of the original data for comparison
    data_original = data.copy()
    
    # Handle different normalization methods
    if method == 'min_max':
        scaler = MinMaxScaler()
        data_transformed = pd.DataFrame(
            scaler.fit_transform(data),
            columns=data.columns
        )
        
        for col in data.columns:
            if col in column_stats:
                result['results'][col] = {
                    'status': 'success',
                    'original_stats': column_stats[col],
                    'transformation_params': {
                        'min': float(scaler.data_min_[data.columns.get_loc(col)]),
                        'max': float(scaler.data_max_[data.columns.get_loc(col)]),
                        'scale': float(scaler.scale_[data.columns.get_loc(col)])
                    }
                }
        
    elif method == 'z_score':
        scaler = StandardScaler()
        data_transformed = pd.DataFrame(
            scaler.fit_transform(data),
            columns=data.columns
        )
        
        for col in data.columns:
            if col in column_stats:
                result['results'][col] = {
                    'status': 'success',
                    'original_stats': column_stats[col],
                    'transformation_params': {
                        'mean': float(scaler.mean_[data.columns.get_loc(col)]),
                        'std': float(scaler.scale_[data.columns.get_loc(col)])
                    }
                }
        
    elif method == 'robust':
        scaler = RobustScaler()
        data_transformed = pd.DataFrame(
            scaler.fit_transform(data),
            columns=data.columns
        )
        
        for col in data.columns:
            if col in column_stats:
                result['results'][col] = {
                    'status': 'success',
                    'original_stats': column_stats[col],
                    'transformation_params': {
                        'center': float(scaler.center_[data.columns.get_loc(col)]),
                        'scale': float(scaler.scale_[data.columns.get_loc(col)])
                    }
                }
                
    elif method == 'quantile':
        scaler = QuantileTransformer(output_distribution='normal')
        data_transformed = pd.DataFrame(
            scaler.fit_transform(data),
            columns=data.columns
        )
        
        for col in data.columns:
            if col in column_stats:
                result['results'][col] = {
                    'status': 'success',
                    'original_stats': column_stats[col],
                    'transformation_params': {
                        'n_quantiles': scaler.n_quantiles,
                        'output_distribution': scaler.output_distribution
                    }
                }
                
    elif method == 'log':
        # For log transform, handle negative or zero values
        data_transformed = data.copy()
        
        for col in data.columns:
            if col in column_stats:
                col_data = data[col].dropna()
                if col_data.min() > 0:  # Standard log transform
                    data_transformed[col] = np.log(data[col])
                    result['results'][col] = {
                        'status': 'success',
                        'original_stats': column_stats[col],
                        'transformation_params': {
                            'transform': 'natural_log'
                        }
                    }
                else:  # Use log1p for zero or negative values
                    offset = abs(col_data.min()) + 1 if col_data.min() <= 0 else 0
                    data_transformed[col] = np.log1p(data[col] + offset)
                    result['results'][col] = {
                        'status': 'success',
                        'original_stats': column_stats[col],
                        'transformation_params': {
                            'transform': 'log1p',
                            'offset': float(offset)
                        }
                    }
    
    else:
        raise ValueError(f"Unsupported normalization method: {method}")

    # Add sample data for visual comparison
    samples = get_sample_data(data_original, data_transformed)
    result['samples'] = samples
    
    # Calculate statistics for transformed data
    for col in data.columns:
        if col in column_stats:
            col_data = data_transformed[col].dropna()
            transformed_stats = {
                'min': float(col_data.min()),
                'max': float(col_data.max()),
                'mean': float(col_data.mean()),
                'median': float(col_data.median()),
                'std': float(col_data.std())
            }
            result['results'][col]['transformed_stats'] = transformed_stats
    
except Exception as e:
    result = {
        'success': False,
        'error': str(e),
        'method': method
    }

# Print the result as JSON for Node.js to capture
print(json.dumps(result))
`;

    const scriptPath = path.join(tempDir, `normalization_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, scriptContent);

    console.log(`[INFO] Executing Python normalization script: ${scriptPath}`);

    // Spawn a Python process to execute the script
    const pythonProcess = spawn("python", [scriptPath, method]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON OUTPUT] ${data}`);
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR] ${data}`);
      errorString += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      console.log(`[INFO] Python process exited with code ${code}`);

      // Clean up temporary files
      try {
        fs.unlinkSync(tempCsvPath);
        fs.unlinkSync(scriptPath);
      } catch (e) {
        console.error("[ERROR] Failed to clean up temporary files:", e);
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Python script execution failed with code ${code}: ${errorString}`,
        });
      }

      try {
        // Parse the JSON output from Python
        const jsonStartIndex = dataString.indexOf("{");
        if (jsonStartIndex === -1) {
          throw new Error("Invalid output from Python script");
        }

        const jsonOutput = dataString.substring(jsonStartIndex);
        const result = JSON.parse(jsonOutput);

        // Store normalized dataset in the database with a new name
        const normalizedDatasetPath = path.join(
          path.dirname(dataset.path),
          `normalized_${path.basename(dataset.path)}`
        );

        // Add normalized data to the database
        const normalizedDataset = new Dataset({
          name: `${dataset.name}_normalized_${method}`,
          path: normalizedDatasetPath,
          size: fs.statSync(dataset.path).size,
          uploadDate: new Date(),
          columns: headers,
          rows: lines.length - 1,
          normalizationMethod: method,
          normalizedColumns: columns,
          parentDataset: dataset._id,
          metadata: {
            normalizationResults: result,
          },
        });

        normalizedDataset
          .save()
          .then((saved) => {
            // Include the normalized dataset ID in the result
            result.normalizedDatasetId = saved._id;

            res.status(200).json(result);
          })
          .catch((saveErr) => {
            console.error(
              "[ERROR] Failed to save normalized dataset to DB:",
              saveErr
            );
            res.status(200).json(result); // Still return the result even if DB save fails
          });
      } catch (e) {
        console.error("[ERROR] Failed to parse Python script output:", e);
        res.status(500).json({
          success: false,
          error: "Failed to parse normalization results",
        });
      }
    });
  } catch (error) {
    console.error("[ERROR] Normalization failed:", error);
    res.status(500).json({
      success: false,
      error: "Normalization failed: " + error.message,
    });
  }
});

// ML route for feature selection
mlRouter.post("/feature-selection", async (req, res) => {
  try {
    const { columns, target, method, top_features, datasetId } = req.body;

    if (!columns || !target || !method) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: columns, target, and method are required",
      });
    }

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        error: "Dataset ID is required",
      });
    }

    console.log(`[INFO] Processing feature selection using ${method}`);
    console.log(`[INFO] Target column: ${target}`);
    console.log(`[INFO] Selected columns: ${columns.join(", ")}`);

    // Find the dataset in the database
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: "Dataset not found",
      });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({
        success: false,
        error: "Dataset file not found",
      });
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(dataset.path, "utf8");
    const lines = fileContent.split("\n");

    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "Dataset is empty",
      });
    }

    // Get headers and validate requested columns and target
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const allColumnsWithTarget = [...columns, target];
    const invalidColumns = allColumnsWithTarget.filter(
      (col) => !headers.includes(col)
    );

    if (invalidColumns.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid columns: ${invalidColumns.join(", ")}`,
      });
    }

    // Create a temporary directory for Python script execution
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a temporary CSV with all needed columns (features + target)
    const tempCsvPath = path.join(
      tempDir,
      `feature_selection_${Date.now()}.csv`
    );

    // Extract all columns needed (features and target)
    const neededColumns = Array.from(new Set([...columns, target]));
    const columnIndices = neededColumns.map((col) => headers.indexOf(col));

    // Write the CSV header
    let csvContent = neededColumns.join(",") + "\n";

    // Extract and write data rows
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""));

        if (values.length === headers.length) {
          const selectedValues = columnIndices.map((idx) => values[idx]);
          csvContent += selectedValues.join(",") + "\n";
        }
      }
    }

    fs.writeFileSync(tempCsvPath, csvContent);

    // Prepare Python script for feature selection
    const scriptContent = `
import pandas as pd
import numpy as np
import json
import sys
from sklearn.feature_selection import SelectKBest, chi2, f_classif, mutual_info_classif, mutual_info_regression, f_regression
from sklearn.preprocessing import LabelEncoder

# Load data
data = pd.read_csv('${tempCsvPath.replace(/\\/g, "\\\\")}')

# Get parameters
method = sys.argv[1]
target_column = sys.argv[2]
top_n = int(sys.argv[3]) if len(sys.argv) > 3 else 10

# Initialize results
result = {
    'success': True,
    'method': method,
    'target': target_column,
    'results': []
}

# Separate features and target
X = data.drop(columns=[target_column])
y = data[target_column]

# Check if target is categorical or numerical
is_categorical_target = y.dtype == 'object'

# Encode categorical target if needed
if is_categorical_target:
    le = LabelEncoder()
    y = le.fit_transform(y)
    result['target_encoding'] = dict(zip(le.classes_, range(len(le.classes_))))

# Handle categorical features
categorical_cols = []
for col in X.columns:
    if X[col].dtype == 'object':
        categorical_cols.append(col)
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])

# Choose the appropriate feature selection method
if method == 'mutual_info':
    if is_categorical_target:
        selector = SelectKBest(mutual_info_classif, k='all')
    else:
        selector = SelectKBest(mutual_info_regression, k='all')
    
    X_new = selector.fit_transform(X, y)
    scores = selector.scores_
    
elif method == 'correlation':
    if is_categorical_target:
        selector = SelectKBest(f_classif, k='all')
    else:
        selector = SelectKBest(f_regression, k='all')
    
    X_new = selector.fit_transform(X, y)
    scores = selector.scores_
    
elif method == 'chi2':
    # Chi-square requires non-negative values
    # Check if all data is non-negative
    has_negative = (X < 0).any().any()
    if has_negative:
        # Apply min-max scaling if there are negative values
        for col in X.columns:
            if (X[col] < 0).any():
                min_val = X[col].min()
                X[col] = X[col] - min_val

    selector = SelectKBest(chi2, k='all')
    X_new = selector.fit_transform(X, y)
    scores = selector.scores_
else:
    raise ValueError(f"Unsupported method: {method}")

# Create feature importance dataframe
feature_scores = []
for i, col in enumerate(X.columns):
    p_value = 0
    if hasattr(selector, 'pvalues_'):
        p_value = selector.pvalues_[i]
        
    feature_scores.append({
        'feature': col,
        'score': float(scores[i]),
        'p_value': float(p_value) if p_value else None
    })

# Sort by score in descending order
feature_scores = sorted(feature_scores, key=lambda x: x['score'], reverse=True)

# Get top N features
top_features = feature_scores[:top_n]
result['results'] = top_features

# Add metadata
result['total_features'] = len(feature_scores)
result['categorical_features'] = categorical_cols
result['is_categorical_target'] = is_categorical_target

# Print JSON result for the Node.js process to capture
print(json.dumps(result))
`;

    const scriptPath = path.join(tempDir, `feature_selection_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, scriptContent);

    console.log(
      `[INFO] Executing Python feature selection script: ${scriptPath}`
    );

    // Spawn a Python process to execute the script
    const pythonProcess = spawn("python", [
      scriptPath,
      method,
      target,
      top_features ? top_features.toString() : "5",
    ]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON OUTPUT] ${data}`);
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR] ${data}`);
      errorString += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      console.log(`[INFO] Python process exited with code ${code}`);

      // Clean up temporary files
      try {
        fs.unlinkSync(tempCsvPath);
        fs.unlinkSync(scriptPath);
      } catch (e) {
        console.error("[ERROR] Failed to clean up temporary files:", e);
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Python script execution failed with code ${code}: ${errorString}`,
        });
      }

      try {
        // Parse the JSON output from Python
        const jsonStartIndex = dataString.indexOf("{");
        if (jsonStartIndex === -1) {
          throw new Error("Invalid output from Python script");
        }

        const jsonOutput = dataString.substring(jsonStartIndex);
        const result = JSON.parse(jsonOutput);

        res.status(200).json(result);
      } catch (e) {
        console.error("[ERROR] Failed to parse Python script output:", e);
        res.status(500).json({
          success: false,
          error: "Failed to parse feature selection results",
        });
      }
    });
  } catch (error) {
    console.error("[ERROR] Feature selection failed:", error);
    res.status(500).json({
      success: false,
      error: "Feature selection failed: " + error.message,
    });
  }
});

// ML route for data splitting
mlRouter.post("/data-split", async (req, res) => {
  try {
    const {
      datasetId,
      trainRatio,
      testRatio,
      validationRatio,
      randomState,
      stratify,
      stratifyColumn,
    } = req.body;

    if (!datasetId || !trainRatio || !testRatio) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: datasetId, trainRatio, and testRatio are required",
      });
    }

    // Validate ratios sum to 1.0
    const total =
      parseFloat(trainRatio) +
      parseFloat(testRatio) +
      parseFloat(validationRatio || 0);
    if (Math.abs(total - 1.0) > 0.001) {
      return res.status(400).json({
        success: false,
        error: `Split ratios must sum to 1.0. Current sum: ${total.toFixed(2)}`,
      });
    }

    console.log(
      `[INFO] Processing data split with train:${trainRatio}, test:${testRatio}, validation:${
        validationRatio || 0
      }`
    );

    // Find the dataset in the database
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: "Dataset not found",
      });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({
        success: false,
        error: "Dataset file not found",
      });
    }

    // Create a temporary directory for Python script execution
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Prepare Python script for data splitting
    const scriptPath = path.join(tempDir, `data_split_${Date.now()}.py`);
    const scriptContent = `
import pandas as pd
import numpy as np
import json
import sys
from sklearn.model_selection import train_test_split

# Load the dataset
try:
    data = pd.read_csv('${dataset.path.replace(/\\/g, "\\\\")}')
    
    # Get parameters
    train_ratio = ${trainRatio}
    test_ratio = ${testRatio}
    validation_ratio = ${validationRatio || 0}
    random_state = ${randomState || 42}
    stratify_enabled = ${stratify ? "True" : "False"}
    stratify_column = "${stratifyColumn || ""}"
    
    result = {
        'success': True,
        'splits': {
            'train': {'ratio': train_ratio, 'count': 0},
            'test': {'ratio': test_ratio, 'count': 0},
        },
        'total_rows': len(data),
        'column_info': {}
    }
    
    if validation_ratio > 0:
        result['splits']['validation'] = {'ratio': validation_ratio, 'count': 0}
    
    # Function to get column types and basic info
    def get_column_info(df):
        column_info = {}
        for col in df.columns:
            # For each column, get type and basic stats
            if pd.api.types.is_numeric_dtype(df[col]):
                column_info[col] = {
                    'type': 'numeric',
                    'missing': int(df[col].isna().sum()),
                    'unique': int(df[col].nunique()),
                    'mean': float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    'min': float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    'max': float(df[col].max()) if not pd.isna(df[col].max()) else None
                }
            else:
                column_info[col] = {
                    'type': 'categorical',
                    'missing': int(df[col].isna().sum()),
                    'unique': int(df[col].nunique()),
                    'top_values': df[col].value_counts().head(5).to_dict()
                }
        return column_info
    
    # Perform the split
    try:
        # Initialize stratify_data variable
        stratify_data = None
        
        # Check if stratification is enabled and the column exists
        if stratify_enabled and stratify_column in data.columns:
            # Handle missing values in stratify column
            if data[stratify_column].isna().any():
                # Fill NA with a placeholder
                data[stratify_column] = data[stratify_column].fillna('__NA__')
            
            stratify_data = data[stratify_column]
            result['stratify'] = {
                'enabled': True,
                'column': stratify_column,
                'value_counts': data[stratify_column].value_counts().to_dict()
            }
        
        # First split: train and remaining (test + validation)
        if validation_ratio > 0:
            # If we have validation, adjust the test_size for the first split
            # The first split should give us the train set and (test+validation) combined
            first_test_size = test_ratio + validation_ratio
            
            X_train, X_temp, = train_test_split(
                data, 
                test_size=first_test_size,
                random_state=random_state,
                stratify=stratify_data
            )
            
            # Second split: separate test from validation
            # The ratio of test to validation in the temp set
            second_test_size = test_ratio / first_test_size
            
            # For stratification in the second split
            if stratify_enabled and stratify_column in data.columns:
                second_stratify = X_temp[stratify_column]
            else:
                second_stratify = None
                
            X_test, X_validation = train_test_split(
                X_temp,
                test_size=(1-second_test_size),  # This gives us the validation ratio
                random_state=random_state,
                stratify=second_stratify
            )
            
            # Update counts
            result['splits']['train']['count'] = len(X_train)
            result['splits']['test']['count'] = len(X_test)
            result['splits']['validation']['count'] = len(X_validation)
            
            # Create copies of the datasets
            result['train_samples'] = X_train.head(5).to_dict('records')
            result['test_samples'] = X_test.head(5).to_dict('records')
            result['validation_samples'] = X_validation.head(5).to_dict('records')
            
            # Save the splits to CSV files
            train_path = '${dataset.path
              .replace(/\\/g, "\\\\")
              .replace(".csv", "")}_train.csv'
            test_path = '${dataset.path
              .replace(/\\/g, "\\\\")
              .replace(".csv", "")}_test.csv'
            val_path = '${dataset.path
              .replace(/\\/g, "\\\\")
              .replace(".csv", "")}_validation.csv'
            
            X_train.to_csv(train_path, index=False)
            X_test.to_csv(test_path, index=False)
            X_validation.to_csv(val_path, index=False)
            
            result['file_paths'] = {
                'train': train_path,
                'test': test_path,
                'validation': val_path
            }
            
        else:
            # Simple train/test split
            X_train, X_test = train_test_split(
                data, 
                test_size=test_ratio,
                random_state=random_state,
                stratify=stratify_data
            )
            
            # Update counts
            result['splits']['train']['count'] = len(X_train)
            result['splits']['test']['count'] = len(X_test)
            
            # Create copies of the datasets
            result['train_samples'] = X_train.head(5).to_dict('records')
            result['test_samples'] = X_test.head(5).to_dict('records')
            
            # Save the splits to CSV files
            train_path = '${dataset.path
              .replace(/\\/g, "\\\\")
              .replace(".csv", "")}_train.csv'
            test_path = '${dataset.path
              .replace(/\\/g, "\\\\")
              .replace(".csv", "")}_test.csv'
            
            X_train.to_csv(train_path, index=False)
            X_test.to_csv(test_path, index=False)
            
            result['file_paths'] = {
                'train': train_path,
                'test': test_path
            }
        
        # Add column information
        result['column_info'] = get_column_info(data)
        
    except Exception as e:
        result = {
            'success': False,
            'error': f'Error during data splitting: {str(e)}'
        }
        
except Exception as e:
    result = {
        'success': False,
        'error': f'Error loading data: {str(e)}'
    }

# Print the result as JSON for Node.js to capture
print(json.dumps(result))
`;

    fs.writeFileSync(scriptPath, scriptContent);

    console.log(`[INFO] Executing Python data splitting script: ${scriptPath}`);

    // Spawn a Python process to execute the script
    const pythonProcess = spawn("python", [scriptPath]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON OUTPUT] ${data}`);
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR] ${data}`);
      errorString += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      console.log(`[INFO] Python process exited with code ${code}`);

      // Clean up temporary script file
      try {
        fs.unlinkSync(scriptPath);
      } catch (e) {
        console.error("[ERROR] Failed to clean up temporary script file:", e);
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Python script execution failed with code ${code}: ${errorString}`,
        });
      }

      try {
        // Parse the JSON output from Python
        const jsonStartIndex = dataString.indexOf("{");
        if (jsonStartIndex === -1) {
          throw new Error("Invalid output from Python script");
        }

        const jsonOutput = dataString.substring(jsonStartIndex);
        const result = JSON.parse(jsonOutput);

        if (!result.success) {
          return res.status(500).json(result);
        }

        // Create dataset entries for each split
        const splitDatasets = [];

        // Create train dataset
        if (result.file_paths.train) {
          const trainDataset = new Dataset({
            name: `${dataset.name}_train`,
            path: result.file_paths.train,
            size: fs.statSync(result.file_paths.train).size,
            uploadDate: new Date(),
            rows: result.splits.train.count,
            columns: Object.keys(result.column_info),
            parentDataset: dataset._id,
            splitType: "train",
            splitRatio: trainRatio,
            metadata: {
              splitInfo: result,
            },
          });
          await trainDataset.save();
          splitDatasets.push({
            type: "train",
            datasetId: trainDataset._id,
            count: result.splits.train.count,
            ratio: trainRatio,
          });
        }

        // Create test dataset
        if (result.file_paths.test) {
          const testDataset = new Dataset({
            name: `${dataset.name}_test`,
            path: result.file_paths.test,
            size: fs.statSync(result.file_paths.test).size,
            uploadDate: new Date(),
            rows: result.splits.test.count,
            columns: Object.keys(result.column_info),
            parentDataset: dataset._id,
            splitType: "test",
            splitRatio: testRatio,
            metadata: {
              splitInfo: result,
            },
          });
          await testDataset.save();
          splitDatasets.push({
            type: "test",
            datasetId: testDataset._id,
            count: result.splits.test.count,
            ratio: testRatio,
          });
        }

        // Create validation dataset if exists
        if (result.file_paths.validation) {
          const validationDataset = new Dataset({
            name: `${dataset.name}_validation`,
            path: result.file_paths.validation,
            size: fs.statSync(result.file_paths.validation).size,
            uploadDate: new Date(),
            rows: result.splits.validation.count,
            columns: Object.keys(result.column_info),
            parentDataset: dataset._id,
            splitType: "validation",
            splitRatio: validationRatio,
            metadata: {
              splitInfo: result,
            },
          });
          await validationDataset.save();
          splitDatasets.push({
            type: "validation",
            datasetId: validationDataset._id,
            count: result.splits.validation.count,
            ratio: validationRatio,
          });
        }

        // Add dataset IDs to result
        result.datasets = splitDatasets;

        res.status(200).json(result);
      } catch (e) {
        console.error("[ERROR] Failed to parse Python script output:", e);
        res.status(500).json({
          success: false,
          error: "Failed to parse data splitting results: " + e.message,
        });
      }
    });
  } catch (error) {
    console.error("[ERROR] Data splitting failed:", error);
    res.status(500).json({
      success: false,
      error: "Data splitting failed: " + error.message,
    });
  }
});

// ML route for encoding
mlRouter.post("/encode", async (req, res) => {
  try {
    const { columns, method, datasetId } = req.body;

    if (!columns || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: columns and method are required",
      });
    }

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        error: "Dataset ID is required",
      });
    }

    console.log(
      `[INFO] Encoding columns: ${columns.join(", ")} using method: ${method}`
    );

    // Find the dataset in the database
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: "Dataset not found",
      });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({
        success: false,
        error: "Dataset file not found",
      });
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(dataset.path, "utf8");
    const lines = fileContent.split("\n");

    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "Dataset is empty",
      });
    }

    // Get headers and validate requested columns
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const invalidColumns = columns.filter((col) => !headers.includes(col));
    if (invalidColumns.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid columns: ${invalidColumns.join(", ")}`,
      });
    }

    // Extract column indices
    const columnIndices = columns.map((col) => headers.indexOf(col));

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""));

        const rowData = {};
        columnIndices.forEach((colIdx, idx) => {
          const colName = columns[idx];
          const value = values[colIdx];
          rowData[colName] = value;
        });

        data.push(rowData);
      }
    }

    // Create a temporary directory for Python script execution
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a temporary CSV with just the selected columns
    const tempCsvPath = path.join(tempDir, `encoding_${Date.now()}.csv`);
    let csvContent = columns.join(",") + "\n";

    data.forEach((row) => {
      const rowValues = columns.map((col) => row[col]);
      csvContent += rowValues.join(",") + "\n";
    });

    fs.writeFileSync(tempCsvPath, csvContent);

    // Prepare Python script for encoding
    const scriptContent = `
import pandas as pd
import numpy as np
import json
import sys
from sklearn.preprocessing import OneHotEncoder, LabelEncoder

# Load data
data = pd.read_csv('${tempCsvPath.replace(/\\/g, "\\\\")}')

# Get parameters
method = sys.argv[1]

# Initialize results
result = {
    'success': True,
    'method': method,
    'columns': data.columns.tolist(),
    'encoded_samples': [],
    'original_samples': []
}

# Sample the first 10 rows (or fewer if dataset is smaller)
sample_size = min(10, len(data))
sample_indices = list(range(sample_size))
sample_data = data.iloc[sample_indices].copy()

# Store original sample data
for col in data.columns:
    col_data = sample_data[col].tolist()
    result['original_samples'].append({
        'column': col,
        'values': col_data
    })

# Create a new DataFrame for encoded data
encoded_data = pd.DataFrame()

# Apply encoding based on method
if method == 'one-hot':
    for col in data.columns:
        # Apply one-hot encoding
        encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
        col_data = data[[col]]
        encoded_cols = encoder.fit_transform(col_data)
        categories = encoder.categories_[0]
        
        # Create DataFrame with encoded columns
        encoded_df = pd.DataFrame(
            encoded_cols,
            columns=[f"{col}_{cat}" for cat in categories]
        )
        
        # Sample the encoded data
        encoded_sample = encoded_df.iloc[sample_indices].copy()
        
        # Store encoded sample data
        result['encoded_samples'].append({
            'column': col,
            'encoding': 'one-hot',
            'categories': categories.tolist(),
            'encoded_columns': encoded_df.columns.tolist(),
            'values': encoded_sample.to_dict(orient='records')
        })
        
        # Add encoded columns to the data
        for encoded_col in encoded_df.columns:
            encoded_data[encoded_col] = encoded_df[encoded_col]
        
elif method == 'label':
    for col in data.columns:
        # Apply label encoding
        encoder = LabelEncoder()
        encoded_vals = encoder.fit_transform(data[col])
        
        # Add to encoded data
        encoded_data[col] = encoded_vals
        
        # Store encoded sample data
        result['encoded_samples'].append({
            'column': col,
            'encoding': 'label',
            'mapping': dict(zip(encoder.classes_, range(len(encoder.classes_)))),
            'values': encoded_vals[sample_indices].tolist()
        })
        
elif method == 'binary':
    for col in data.columns:
        # Get unique values
        unique_vals = data[col].unique()
        
        # Create mapping to binary
        binary_map = {}
        for i, val in enumerate(unique_vals):
            binary_map[val] = format(i, 'b').zfill(len(bin(len(unique_vals)-1))-2)
        
        # Apply binary encoding
        binary_encoded = data[col].map(binary_map)
        
        # Add to encoded data
        encoded_data[col] = binary_encoded
        
        # Store encoded sample data
        result['encoded_samples'].append({
            'column': col,
            'encoding': 'binary',
            'mapping': binary_map,
            'values': binary_encoded.iloc[sample_indices].tolist()
        })

# Save encoded data to a new file
output_path = tempCsvPath.replace('.csv', '_encoded.csv')
encoded_data.to_csv(output_path, index=False)

# Add metadata to the result
result['output_file'] = output_path
result['row_count'] = len(data)
result['encoded_row_count'] = len(encoded_data)
result['processing_time'] = '0.5s'  # Placeholder

# Print JSON result for the Node.js process to capture
print(json.dumps(result))
`;

    const scriptPath = path.join(tempDir, `encoding_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, scriptContent);

    console.log(`[INFO] Executing Python encoding script: ${scriptPath}`);

    // Spawn a Python process to execute the script
    const pythonProcess = spawn("python", [scriptPath, method]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON OUTPUT] ${data}`);
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR] ${data}`);
      errorString += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      console.log(`[INFO] Python process exited with code ${code}`);

      // Clean up temporary files
      try {
        fs.unlinkSync(tempCsvPath);
        fs.unlinkSync(scriptPath);
        // Don't remove the encoded output file yet (it might be needed for download)
      } catch (e) {
        console.error("[ERROR] Failed to clean up temporary files:", e);
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Python script execution failed with code ${code}: ${errorString}`,
        });
      }

      try {
        // Parse the JSON output from Python
        const jsonStartIndex = dataString.indexOf("{");
        if (jsonStartIndex === -1) {
          throw new Error("Invalid output from Python script");
        }

        const jsonOutput = dataString.substring(jsonStartIndex);
        const result = JSON.parse(jsonOutput);

        // Create a new dataset entry for the encoded data
        const encodedFilename = `encoded_${method}_${dataset.filename}`;
        const encodedPath = result.output_file;

        fs.copyFileSync(encodedPath, path.join(uploadDir, encodedFilename));

        const encodedDataset = new Dataset({
          filename: encodedFilename,
          originalname: `encoded_${method}_${dataset.originalname}`,
          path: path.join(uploadDir, encodedFilename),
          size: fs.statSync(encodedPath).size,
          columns: result.columns,
          processed: true,
        });

        encodedDataset
          .save()
          .then((savedDataset) => {
            result.encodedDatasetId = savedDataset._id;
            res.status(200).json(result);
          })
          .catch((err) => {
            console.error("[ERROR] Failed to save encoded dataset to DB:", err);
            res.status(200).json(result); // Still return the result even if DB save fails
          });
      } catch (e) {
        console.error("[ERROR] Failed to parse Python script output:", e);
        res.status(500).json({
          success: false,
          error: "Failed to parse encoding results",
        });
      }
    });
  } catch (error) {
    console.error("[ERROR] Encoding failed:", error);
    res.status(500).json({
      success: false,
      error: "Encoding failed: " + error.message,
    });
  }
});

// Use ML routes - mount on /ml path
app.use("/ml", mlRouter);

// Use auth routes
app.use("/api/auth", authRoutes);

// Store the latest processing results
let latestResults = null;

// Track processing status for each file
const processingStatus = {};

// API Routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "up",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Get processing status endpoint
app.get("/api/processing-status", (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "Filename parameter is required" });
  }

  // Check if we have results for this file
  if (
    latestResults &&
    (latestResults.status === "success" || latestResults.status === "error")
  ) {
    return res.status(200).json({
      status: "completed",
      error: latestResults.error || null,
    });
  }

  // Check if the file is being processed
  if (processingStatus[filename]) {
    return res.status(200).json({
      status: "processing",
      message: "File is still being processed",
    });
  }

  // If no status found
  return res.status(404).json({
    status: "unknown",
    error: "No processing information found for this file",
  });
});

// Get results endpoint
app.get("/api/results", (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "Filename parameter is required" });
  }

  // Check if we have results
  if (!latestResults) {
    return res.status(404).json({
      error: "No results found",
      status: "error",
    });
  }

  // Return the latest results
  res.status(200).json(latestResults);
});

// Upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    };

    // Set initial processing status
    processingStatus[req.file.originalname] = {
      status: "uploaded",
      uploadedAt: Date.now(),
      filePath: req.file.path,
    };

    console.log("[INFO] File uploaded:", fileInfo);
    res.status(200).json(fileInfo);
  } catch (error) {
    console.error("[ERROR] Upload failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Process endpoint
app.post("/api/process", async (req, res) => {
  try {
    const { filePath } = req.body;
    let filename = null; // Declare filename at function scope

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File does not exist" });
    }

    // Get filename from path
    filename = path.basename(filePath);

    // Set processing status
    processingStatus[filename] = {
      startTime: Date.now(),
      status: "processing",
    };

    // Check file size - if too large, handle appropriately
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`[INFO] File size: ${fileSizeInMB.toFixed(2)} MB`);

    if (fileSizeInMB > 100) {
      // Update processing status to error
      processingStatus[filename] = {
        status: "error",
        error: "File too large. Maximum allowed size is 100MB.",
        fileSize: `${fileSizeInMB.toFixed(2)} MB`,
      };

      return res.status(400).json({
        error: "File too large. Maximum allowed size is 100MB.",
        fileSize: `${fileSizeInMB.toFixed(2)} MB`,
      });
    }

    console.log("[INFO] Starting processing for file:", filePath);

    // Prepare image folder path
    const uniqueRunId = Date.now().toString();
    const imageFolder = path.join(imagesDir, uniqueRunId);

    // Create the image folder in advance
    if (!fs.existsSync(imageFolder)) {
      fs.mkdirSync(imageFolder, { recursive: true });
      console.log(`[INFO] Created image folder: ${imageFolder}`);
    }

    // Set timeout for large file processing (15 minutes for large files)
    const processTimeout = fileSizeInMB > 15 ? 15 * 60 * 1000 : 10 * 60 * 1000;
    console.log(
      `[INFO] Setting process timeout to ${processTimeout / 60000} minutes`
    );

    // First, return a quick response to prevent timeout
    res.status(202).json({
      message: "Processing started",
      status: "processing",
      timestamp: new Date().toISOString(),
      filePath: filePath,
    });

    // Then continue processing in the background
    try {
      // Use default 'python' command
      const pythonCommand = "python";

      // The Python script and CSV file are now in the scripts directory
      const scriptDir = path.join(__dirname, "scripts");
      const targetFile = path.join(scriptDir, "final_aggregated.csv");

      // Make sure the file is copied to where the script expects it
      fs.copyFileSync(filePath, targetFile);
      console.log(`[INFO] Copied ${filePath} to ${targetFile}`);

      // Models and images folders are now directly in the server directory
      const pythonProcess = spawn(pythonCommand, [
        path.join(__dirname, "scripts", "iot_botnet_inference.py"),
        "--csv",
        targetFile,
        "--autoencoder",
        path.join(__dirname, "models", "autoencoder_model.h5"),
        "--cnn",
        path.join(__dirname, "models", "cnn_model_balanced_50k.pth"),
        "--image_folder",
        imageFolder,
      ]);

      let dataString = "";
      let errorString = "";

      pythonProcess.stdout.on("data", (data) => {
        console.log("[PYTHON]", data.toString());
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error("[PYTHON ERROR]", data.toString());
        errorString += data.toString();
      });

      // Create a promise to handle the process completion
      const processPromise = new Promise((resolve, reject) => {
        pythonProcess.on("close", async (code) => {
          console.log(`[INFO] Python process exited with code ${code}`);

          if (code !== 0) {
            return reject(
              new Error(
                `Processing failed with exit code ${code}. Error: ${errorString}`
              )
            );
          }

          try {
            // Extract JSON from Python output
            const jsonStartIndex = dataString.indexOf("{");
            if (jsonStartIndex === -1) {
              return reject(new Error("Invalid output from Python script"));
            }

            const jsonOutput = dataString.substring(jsonStartIndex);
            let results;

            try {
              results = JSON.parse(jsonOutput);
            } catch (parseError) {
              console.error("[ERROR] JSON parse error:", parseError);
              console.log("[DEBUG] Attempted to parse:", jsonOutput);
              return reject(
                new Error(`Failed to parse JSON output: ${parseError.message}`)
              );
            }

            // Check if there's an error in the results
            if (results.error) {
              console.warn(
                "[WARNING] Python script returned error:",
                results.error
              );
            }

            // Store results for later retrieval
            latestResults = {
              ...results,
              timestamp: new Date().toISOString(),
              imageFolder: imageFolder,
              processingTime: (Date.now() - parseInt(uniqueRunId)) / 1000, // Add processing time in seconds
              fileSize: fileSizeInMB.toFixed(2),
              status: results.error ? "error" : "success",
            };

            // Ensure processing_time is properly set
            latestResults.processing_time =
              latestResults.processingTime ||
              latestResults.processing_time ||
              0;

            // Calculate additional metrics if not provided by the Python script
            if (
              !latestResults.anomaly_score &&
              latestResults.anomalies_flagged &&
              latestResults.total_rows
            ) {
              latestResults.anomaly_score = (
                latestResults.anomalies_flagged / latestResults.total_rows
              ).toFixed(2);
            }

            // Calculate prediction counts from cnn_predictions if needed
            if (
              latestResults.cnn_predictions &&
              !latestResults.prediction_counts
            ) {
              const predictionCounts = {};
              Object.values(latestResults.cnn_predictions).forEach(
                (typeIndex) => {
                  const key = typeIndex.toString();
                  predictionCounts[key] = (predictionCounts[key] || 0) + 1;
                }
              );
              latestResults.prediction_counts = predictionCounts;

              // Calculate confidence score based on prediction uniformity
              const totalPredictions = Object.values(predictionCounts).reduce(
                (a, b) => a + Number(b),
                0
              );
              if (totalPredictions > 0) {
                const dominantType = Object.entries(predictionCounts).sort(
                  (a, b) => b[1] - a[1]
                )[0];
                latestResults.confidence_score = (
                  dominantType[1] / totalPredictions
                ).toFixed(2);
              } else {
                latestResults.confidence_score = "0.00";
              }
            }

            // Update processing status
            processingStatus[filename] = {
              status: "completed",
              completedAt: Date.now(),
            };

            resolve(latestResults);
          } catch (error) {
            console.error("[ERROR] Failed to parse Python output:", error);

            // If JSON parsing fails, create a minimal valid response
            latestResults = {
              total_rows: 0,
              anomalies_flagged: 0,
              autoencoder_threshold: 0.05,
              reconstruction_errors: [],
              cnn_predictions: {},
              timestamp: new Date().toISOString(),
              error: error.message,
              status: "error",
            };

            // Update processing status to error
            if (filename) {
              processingStatus[filename] = {
                status: "error",
                error: error.message,
                completedAt: Date.now(),
              };
            }

            reject(error);
          }
        });

        pythonProcess.on("error", (err) => {
          console.error("[PYTHON PROCESS ERROR]", err);
          reject(err);
        });
      });

      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          pythonProcess.kill(); // Kill the process if it times out
          reject(
            new Error(
              `Processing timed out after ${processTimeout / 60000} minutes`
            )
          );
        }, processTimeout);
      });

      // Wait for either the process to complete or timeout
      const result = await Promise.race([processPromise, timeoutPromise]);

      console.log("[INFO] Processing completed successfully");
    } catch (error) {
      console.error("[ERROR] Processing failed:", error.message);

      // Store error result for retrieval
      latestResults = {
        error: error.message,
        total_rows: 0,
        anomalies_flagged: 0,
        autoencoder_threshold: 0.05,
        reconstruction_errors: [],
        cnn_predictions: {},
        timestamp: new Date().toISOString(),
        status: "error",
      };
    }
  } catch (error) {
    console.error("[ERROR] Initial setup failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
