#!/usr/bin/env python3
"""
iot_botnet_inference.py

A script for your Node.js backend to:
1) Read final_aggregated.csv (which contains 6 numeric columns).
2) Normalize the features.
3) Run a pre-trained autoencoder (TensorFlow/Keras) for anomaly detection.
4) Generate RGB images from normalized features (if missing).
5) Run a pre-trained CNN (PyTorch) to classify each image.
6) Print JSON output with anomaly counts, reconstruction errors, and CNN predictions.

Folder structure (relative to this script):
  - final_aggregated.csv
  - ../models/autoencoder_model.h5
  - ../models/cnn_model_balanced_50k.pth
  - ../images/  (RGB images will be stored here)
"""

import os
import argparse
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from PIL import Image

import tensorflow as tf
import torch
import torch.nn as nn
from torchvision import transforms

# The 6 required columns for autoencoder and CNN inference.
REQUIRED_COLUMNS = [
    "inbound_length_count",
    "inbound_length_mean",
    "inbound_length_std",
    "outbound_length_count",
    "outbound_length_mean",
    "outbound_length_std"
]

##############################
# Load Autoencoder Model (TensorFlow/Keras)
##############################
def load_autoencoder_model(model_path=None):
    """Load the autoencoder model from disk."""
    try:
        if model_path is None:
            # Default to the models directory in the server folder
            script_dir = os.path.dirname(os.path.abspath(__file__))
            server_dir = os.path.dirname(script_dir)
            model_path = os.path.join(server_dir, 'models', 'autoencoder_model.h5')
        
        print(f"[INFO] Loading autoencoder model from: {model_path}")
        custom_objs = {
            'mse': tf.keras.losses.MeanSquaredError(),
            'mean_squared_error': tf.keras.losses.MeanSquaredError()
        }
        model = tf.keras.models.load_model(model_path, custom_objects=custom_objs)
        return model
    except Exception as e:
        print(f"[ERROR] Failed to load autoencoder model: {str(e)}")
        raise

##############################
# Load CNN Model (PyTorch)
##############################
class LightweightCNN(nn.Module):
    def __init__(self, num_classes=4):
        super(LightweightCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.relu = nn.ReLU6(inplace=True)
        self.bottleneck1 = self._bottleneck_block(32, 16, stride=1, expansion=1)
        self.bottleneck2 = self._bottleneck_block(16, 32, stride=2, expansion=4)
        self.bottleneck3 = self._bottleneck_block(32, 64, stride=1, expansion=4)
        self.bottleneck4 = self._bottleneck_block(64, 128, stride=2, expansion=6)
        self.conv2 = nn.Conv2d(128, 128, kernel_size=1)
        self.bn2 = nn.BatchNorm2d(128)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(128, num_classes)
    
    def _bottleneck_block(self, in_c, out_c, stride, expansion):
        return nn.Sequential(
            nn.Conv2d(in_c, in_c * expansion, kernel_size=1),
            nn.BatchNorm2d(in_c * expansion),
            nn.ReLU6(inplace=True),
            nn.Conv2d(in_c * expansion, in_c * expansion,
                      kernel_size=3, stride=stride, padding=1, groups=in_c * expansion),
            nn.BatchNorm2d(in_c * expansion),
            nn.ReLU6(inplace=True),
            nn.Conv2d(in_c * expansion, out_c, kernel_size=1),
            nn.BatchNorm2d(out_c)
        )
    
    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.bottleneck1(x)
        x = self.bottleneck2(x)
        x = self.bottleneck3(x)
        x = self.bottleneck4(x)
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x

def load_cnn_model(model_path=None):
    """Load the CNN model from disk."""
    try:
        if model_path is None:
            # Default to the models directory in the server folder
            script_dir = os.path.dirname(os.path.abspath(__file__))
            server_dir = os.path.dirname(script_dir)
            model_path = os.path.join(server_dir, 'models', 'cnn_model_balanced_50k.pth')
        
        print(f"[INFO] Loading CNN model from: {model_path}")
        model = LightweightCNN(num_classes=4)
        state_dict = torch.load(model_path, map_location=torch.device('cpu'), weights_only=True)
        model.load_state_dict(state_dict)
        model.eval()
        return model
    except Exception as e:
        print(f"[ERROR] Failed to load CNN model: {str(e)}")
        raise

##############################
# Utility Functions for Data Processing
##############################
def filter_required_columns(df):
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    return df[REQUIRED_COLUMNS].copy()

def normalize_features(df):
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df)
    return pd.DataFrame(scaled, columns=df.columns)

def autoencoder_inference(autoencoder, df, threshold=0.05, batch_size=1000):
    data_np = df.values.astype(np.float32)
    total = data_np.shape[0]
    errors = np.zeros(total, dtype=np.float32)
    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        batch = data_np[start:end]
        print(f"[INFO] Autoencoder inference: processing batch {start//batch_size + 1} of {(total-1)//batch_size + 1}")
        try:
            out = autoencoder(batch)
            recon = out.numpy() if hasattr(out, 'numpy') else np.array(out)
        except Exception as e:
            print(f"[WARNING] Direct model call failed: {e}, using predict() method.")
            recon = autoencoder.predict(batch, verbose=0)
        batch_errors = np.mean(np.power(batch - recon, 2), axis=1)
        errors[start:end] = batch_errors
    flags = errors > threshold
    return errors, flags

def generate_rgb_image_from_row(row, out_path):
    arr = row.values
    size = int(np.ceil(np.sqrt(len(arr))))
    padded = np.zeros(size * size)
    padded[:len(arr)] = arr
    matrix = padded.reshape((size, size))
    rgb_arr = np.stack([matrix, matrix, matrix], axis=-1)
    rgb_arr = np.clip(rgb_arr, 0, 1)
    img_uint8 = (rgb_arr * 255).astype(np.uint8)
    img = Image.fromarray(img_uint8, "RGB")
    img.save(out_path)

def generate_rgb_images(df, out_folder, batch_size=200):
    if not os.path.exists(out_folder):
        os.makedirs(out_folder)
    total = len(df)
    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        print(f"[INFO] Generating RGB images: batch {start//batch_size + 1} of {(total-1)//batch_size + 1}")
        for idx in range(start, end):
            out_name = f"img_{idx}.png"
            out_path = os.path.join(out_folder, out_name)
            if os.path.exists(out_path):
                continue
            generate_rgb_image_from_row(df.iloc[idx], out_path)
    print(f"[INFO] RGB images saved to: {out_folder}")

def cnn_inference(cnn_model, image_folder, batch_size=20):
    preds = {}
    image_files = [f for f in os.listdir(image_folder) if f.endswith(".png")]
    total = len(image_files)
    print(f"[INFO] Running CNN inference on {total} images")
    transform = transforms.Compose([
        transforms.Resize((64, 64)),
        transforms.ToTensor()
    ])
    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        print(f"[INFO] Processing CNN batch {start//batch_size + 1} of {(total-1)//batch_size + 1}")
        for fname in image_files[start:end]:
            fpath = os.path.join(image_folder, fname)
            try:
                img = Image.open(fpath).convert("RGB")
                img_tensor = transform(img).unsqueeze(0)
                with torch.no_grad():
                    output = cnn_model(img_tensor)
                    pred_class = int(torch.argmax(output, dim=1).item())
                preds[fname] = pred_class
            except Exception as e:
                print(f"[WARNING] Error processing image {fpath}: {e}")
    return preds

##############################
# MAIN FUNCTION
##############################
def main():
    parser = argparse.ArgumentParser(description="IoT Botnet Inference Script")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(script_dir)
    
    default_csv = os.path.join(script_dir, "final_aggregated.csv")
    default_ae = os.path.join(server_dir, "models", "autoencoder_model.h5")
    default_cnn = os.path.join(server_dir, "models", "cnn_model_balanced_50k.pth")
    default_images = os.path.join(server_dir, "images")
    
    parser.add_argument("--csv", default=default_csv, help="Path to final_aggregated.csv (6 numeric columns)")
    parser.add_argument("--autoencoder", default=default_ae, help="Path to autoencoder_model.h5")
    parser.add_argument("--cnn", default=default_cnn, help="Path to cnn_model_balanced_50k.pth")
    parser.add_argument("--threshold", type=float, default=0.05, help="Reconstruction error threshold for autoencoder")
    parser.add_argument("--image_folder", default=default_images, help="Folder to save generated RGB images")
    parser.add_argument("--batch_size", type=int, default=1000, help="Batch size for autoencoder inference")
    parser.add_argument("--img_batch", type=int, default=200, help="Batch size for image generation")
    parser.add_argument("--cnn_batch", type=int, default=20, help="Batch size for CNN inference")
    
    args = parser.parse_args()
    
    try:
        print("[INFO] Reading CSV file:", args.csv)
        df = pd.read_csv(args.csv)
        print(f"[INFO] Loaded {len(df)} rows from CSV")
        
        # Filter to required columns and normalize
        df_req = filter_required_columns(df)
        df_norm = normalize_features(df_req)
        
        print("[INFO] Loading autoencoder model and running inference...")
        ae_model = load_autoencoder_model(args.autoencoder)
        errors, flags = autoencoder_inference(ae_model, df_norm, threshold=args.threshold, batch_size=args.batch_size)
        # Replace any NaN errors with 0.0 so JSON is valid
        errors = np.nan_to_num(errors, nan=0.0)
        anomaly_count = int(np.sum(flags))
        print(f"[INFO] Anomalies flagged: {anomaly_count}")
        
        print("[INFO] Generating RGB images from normalized features...")
        generate_rgb_images(df_norm, args.image_folder, batch_size=args.img_batch)
        
        print("[INFO] Loading CNN model and running inference on images...")
        cnn_model = load_cnn_model(args.cnn)
        cnn_preds = cnn_inference(cnn_model, args.image_folder, batch_size=args.cnn_batch)
        
        result = {
            "total_rows": int(len(df_norm)),
            "anomalies_flagged": anomaly_count,
            "autoencoder_threshold": args.threshold,
            "reconstruction_errors": errors.tolist(),
            "cnn_predictions": cnn_preds
        }
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "total_rows": 0,
            "anomalies_flagged": 0,
            "autoencoder_threshold": args.threshold,
            "reconstruction_errors": [],
            "cnn_predictions": {}
        }
        print(json.dumps(error_result, indent=2))

if __name__ == "__main__":
    main()
