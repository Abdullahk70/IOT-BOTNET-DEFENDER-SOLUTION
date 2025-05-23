# IoT-Botnet-Defender

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)
![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-17+-61DAFB.svg)

## 🛡️ Overview

IoT-Botnet-Defender is a powerful web application designed to detect and analyze malicious network traffic patterns in IoT environments. Leveraging advanced machine learning algorithms, this tool identifies common IoT botnet attacks including Mirai, Bashlite, and Torii with high accuracy and confidence.

## ✨ Key Features

- **Real-time Analysis:** Process network traffic data and receive immediate detection results
- **Multi-attack Detection:** Identify various types of IoT botnet attacks through sophisticated classification
- **ML-powered Detection:** Combines autoencoder anomaly detection with CNN classification for accurate results
- **Interactive Visualization:** View attack distribution and patterns through intuitive charts and data tables
- **Detailed Metrics:** Comprehensive statistics including confidence, precision, recall and F1 score
- **Actionable Security Recommendations:** Get specific mitigation strategies based on detected attack types
- **Modern User Interface:** Clean, responsive design for seamless user experience

## 🖥️ Screenshots

![Dashboard](screenshots/dashboard.png)
![Analysis Results](screenshots/results.png)
![Attack Detection](screenshots/detection.png)

## 🔧 Technology Stack

- **Frontend:** React, Bootstrap, Recharts, Motion
- **Backend:** Node.js, Express
- **Machine Learning:** Python, TensorFlow/PyTorch
- **Data Processing:** NumPy, Pandas

## 📦 Installation

### Prerequisites
- Node.js (v14 or later)
- Python 3.8+
- npm or yarn

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/LuqmanKt98/IoT-Botnet-Defender.git
cd IoT-Botnet-Defender
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ..
npm install
```

4. Set up Python environment (for ML components):
```bash
pip install -r requirements.txt
```

5. Start the development server:
```bash
# Start backend server
cd server
node server.js

# In another terminal, start frontend
cd ..
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## 🧠 How It Works

The system analyzes network traffic through a sophisticated multi-stage pipeline:

1. **Data Processing:** The uploaded network traffic data is preprocessed into a suitable format
2. **Anomaly Detection:** An autoencoder neural network identifies unusual traffic patterns
3. **Attack Classification:** A CNN model classifies traffic into specific attack categories:
   - Normal Traffic (0)
   - Mirai Attack (1)
   - Bashlite Attack (2)
   - Torii Attack (3)
4. **Result Analysis:** The system calculates confidence scores and provides actionable insights

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔑 Keywords

IoT security, network traffic analysis, botnet detection, Mirai detection, Bashlite detection, Torii detection, cybersecurity tools, machine learning security, anomaly detection, network security, threat detection, traffic analysis


 
 #   I O T - B O T N E T - D E F E N D E R - S O L U T I O N 
 
 
