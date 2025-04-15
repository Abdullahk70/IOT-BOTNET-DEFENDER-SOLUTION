# Simulation Environment Backend

This is the Express (Node.js) backend for the Simulation Environment project that integrates with a Python inference script for anomaly detection and classification.

## Project Structure

```
server/
├── models/              # Pre-trained ML models
│   ├── autoencoder_model.h5
│   └── cnn_model_balanced_50k.pth
├── scripts/             # Python scripts
│   └── iot_botnet_inference.py
├── uploads/             # Uploaded CSV files
├── images/              # Generated RGB images
├── server.js            # Main Express server
├── package.json         # Dependencies
└── README.md            # This file
```

## Prerequisites

- Node.js (v14+)
- Python 3.7+
- Python packages:
  - numpy
  - pandas
  - scikit-learn
  - tensorflow
  - torch
  - Pillow

## Setup Instructions

1. Install Node.js dependencies:

```bash
npm install
```

2. Install required Python packages:

```bash
pip install numpy pandas scikit-learn tensorflow torch pillow
```

3. Make sure the ML models are in the `models` directory:
   - `autoencoder_model.h5`
   - `cnn_model_balanced_50k.pth`

## Running the Server

Start the development server:

```bash
npm run dev
```

Or for production:

```bash
npm start
```

The server will run on port 5000 by default (http://localhost:5000).

## API Endpoints

### Health Check
- `GET /api/health`
  - Returns server status

### File Upload
- `POST /api/upload`
  - Accepts a CSV file upload (multipart/form-data)
  - Returns file info including path

### Process File
- `POST /api/process`
  - Body: `{ "filePath": "/path/to/file" }`
  - Runs inference pipeline on the uploaded CSV file
  - Returns processing status

### Get Results
- `GET /api/results`
  - Returns the latest processing results
  - Includes total rows, anomalies, errors, and predictions

### Access Images
- `GET /api/images/{timestamp}/{image_name}`
  - Serves generated RGB images

## Integration with Frontend

The frontend should:

1. Upload a CSV file via `/api/upload`
2. Trigger processing via `/api/process` with the returned file path
3. Poll or request results via `/api/results`
4. Display results and images to the user

## Error Handling

The server provides detailed error messages and status codes:
- 400: Bad Request (missing file, invalid input)
- 404: Not Found (file or results not found)
- 500: Server Error (processing failed)

## Logs

The server logs important events:
- File uploads
- Process starts/completions
- Python script outputs
- Errors

Check the console output for logs during development. 