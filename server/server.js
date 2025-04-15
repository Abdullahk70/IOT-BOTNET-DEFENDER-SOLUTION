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

// ML route for file upload
mlRouter.post("/upload", upload.single("file"), (req, res) => {
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

    console.log("[INFO] ML file uploaded:", fileInfo);
    res.status(200).json({
      success: true,
      file: fileInfo,
    });
  } catch (error) {
    console.error("[ERROR] ML upload failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ML route for columns
mlRouter.get("/columns", (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath && filePath !== "") {
      // When no filePath is provided, return mock data for demo purposes
      console.log("[INFO] No file path provided, returning mock columns");
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
mlRouter.get("/retrieve", (req, res) => {
  try {
    // Return mock data for demonstration
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
mlRouter.get("/export", (req, res) => {
  try {
    // Return mock headers and dataset
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

    res.status(200).json({
      headers,
      dataset: mockData,
    });
  } catch (error) {
    console.error("[ERROR] Failed to export dataset:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export dataset: " + error.message,
    });
  }
});

// ML route for normalization
mlRouter.post("/normalize", (req, res) => {
  try {
    const { columns, method } = req.body;

    if (!columns || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: columns and method are required",
      });
    }

    console.log(
      `[INFO] Normalizing columns: ${columns.join(
        ", "
      )} using method: ${method}`
    );

    // For demo purposes, just return success
    res.status(200).json({
      success: true,
      method,
      columns,
      message: `Normalized ${columns.length} columns using ${method} method`,
      processingTime: "0.5s",
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
mlRouter.post("/feature-selection", (req, res) => {
  const { columns, target, method, top_features } = req.body;
  const { filePath } = req.body;

  if (!columns || !target || !method) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: columns, target, and method are required",
    });
  }

  // This would actually process the CSV file
  // For now, we'll simulate the processing with a delay
  console.log(`[INFO] Processing feature selection using ${method}`);
  console.log(`[INFO] Target column: ${target}`);
  console.log(`[INFO] Selected columns: ${columns.join(", ")}`);

  try {
    // For now, calculate simple correlation scores (mock implementation)
    // In a real implementation, this would use actual statistical methods
    const results = columns.map((column) => {
      // Generate a deterministic score based on column name and target
      // This is just for demonstration - real implementation would do actual analysis
      const hash = column
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const targetHash = target
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const score = ((hash * targetHash) % 89) / 100 + 0.1;

      return {
        feature: column,
        score: parseFloat(score.toFixed(4)),
      };
    });

    // Sort by score in descending order
    results.sort((a, b) => b.score - a.score);

    // Only keep top N features based on user selection
    const topFeatures = results.slice(0, top_features || 5);

    setTimeout(() => {
      res.status(200).json({
        success: true,
        method: method,
        target: target,
        results: topFeatures,
      });
    }, 1500); // Processing delay
  } catch (error) {
    console.error("[ERROR] Feature selection failed:", error);
    res.status(500).json({
      success: false,
      error: "Feature selection failed: " + error.message,
    });
  }
});

// ML route for encoding
mlRouter.post("/encode", (req, res) => {
  try {
    const { columns, method } = req.body;

    if (!columns || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: columns and method are required",
      });
    }

    console.log(
      `[INFO] Encoding columns: ${columns.join(", ")} using method: ${method}`
    );

    // For demo purposes, return success after a delay
    setTimeout(() => {
      res.status(200).json({
        success: true,
        method,
        columns,
        message: `Encoded ${columns.length} columns using ${method} method`,
        processingTime: "0.7s",
      });
    }, 800);
  } catch (error) {
    console.error("[ERROR] Encoding failed:", error);
    res.status(500).json({
      success: false,
      error: "Encoding failed: " + error.message,
    });
  }
});

// ML route for feature scaling
mlRouter.post("/feature-scaling", (req, res) => {
  try {
    const { columns, method } = req.body;

    if (!columns || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: columns and method are required",
      });
    }

    console.log(
      `[INFO] Scaling columns: ${columns.join(", ")} using method: ${method}`
    );

    // For demo purposes, return success after a delay
    setTimeout(() => {
      res.status(200).json({
        success: true,
        method,
        columns,
        message: `Scaled ${columns.length} columns using ${method} method`,
        processingTime: "0.6s",
      });
    }, 700);
  } catch (error) {
    console.error("[ERROR] Feature scaling failed:", error);
    res.status(500).json({
      success: false,
      error: "Feature scaling failed: " + error.message,
    });
  }
});

// ML route for visualization
mlRouter.get("/visualization", (req, res) => {
  try {
    // Generate mock visualization data
    const mockData = {
      histograms: {
        age: {
          x: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
          y: [5, 10, 15, 20, 25, 20, 15, 10, 5, 3, 2],
          type: "bar",
        },
        income: {
          x: [
            30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 110000,
            120000,
          ],
          y: [8, 12, 20, 25, 18, 15, 10, 8, 5, 2],
          type: "bar",
        },
      },
      scatterPlots: {
        age_vs_income: {
          x: Array.from(
            { length: 50 },
            () => Math.floor(Math.random() * 50) + 20
          ),
          y: Array.from(
            { length: 50 },
            () => Math.floor(Math.random() * 100000) + 30000
          ),
          mode: "markers",
          type: "scatter",
        },
      },
      correlationMatrix: {
        columns: ["age", "income", "score", "target"],
        data: [
          [1.0, 0.65, 0.23, 0.41],
          [0.65, 1.0, 0.31, 0.55],
          [0.23, 0.31, 1.0, 0.78],
          [0.41, 0.55, 0.78, 1.0],
        ],
      },
    };

    res.status(200).json(mockData);
  } catch (error) {
    console.error("[ERROR] Visualization data generation failed:", error);
    res.status(500).json({
      success: false,
      error: "Visualization failed: " + error.message,
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
        pythonProcess.on("close", (code) => {
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
