
import pandas as pd
import numpy as np
import json
import sys
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, QuantileTransformer, PowerTransformer

# Load the data
data = pd.read_csv('C:\\Users\\scien\\Downloads\\iot-botnet-defender-main (1)\\iot-botnet-defender-main\\server\\temp\\normalization_1744725222252.csv')

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
