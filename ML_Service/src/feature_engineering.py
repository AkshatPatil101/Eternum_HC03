"""
feature_engineering.py

Responsible for loading the dataset, handling missing values, creating derived features,
and splitting the data for model training. Implements the same preprocessing standard
for both training and real-time inference.
"""

import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import KNNImputer
import pickle

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Ensure models dir exists
os.makedirs(MODELS_DIR, exist_ok=True)

# Important columns
VITAL_COLS = ['hr', 'bp_sys', 'spo2', 'rr', 'gcs', 'temp', 'glucose']
SYMPTOM_COLS = ['pupils_unequal', 'chest_pain', 'sweating', 'collapse',
                'road_accident', 'bleeding', 'breathlessness', 'wheezing',
                'confusion', 'drug_intake', 'pregnancy', 'known_diabetes',
                'ecg_abnormal']
DEMOGRAPHIC_COLS = ['age', 'gender']

INPUT_FEATURES = VITAL_COLS + SYMPTOM_COLS + DEMOGRAPHIC_COLS 
# Added shock index during feature engineering
DERIVED_FEATURES = ['shock_index']

ALL_FEATURES = INPUT_FEATURES + DERIVED_FEATURES

class Preprocessor:
    def __init__(self):
        self.imputer = KNNImputer(n_neighbors=5, weights="distance")
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def fit_transform(self, df):
        """Fit preprocessor to training data and transform it."""
        X = df.copy()
        
        # 1. Fill symptoms with 0 (assumed absent if not reported)
        for col in SYMPTOM_COLS:
            if col in X.columns:
                X[col] = X[col].fillna(0)
                
        # 2. Add derived features
        # Calculate shock index, protecting against zero division
        bp_sys = X['bp_sys'].copy()
        # Avoid dividing by zero or negative BP
        bp_sys[bp_sys < 1] = 1.0 
        X['shock_index'] = X['hr'] / bp_sys
        
        # Ensure all columns exist before imputation
        cols = [c for c in INPUT_FEATURES + DERIVED_FEATURES if c in X.columns]
        
        # 3. Impute missing vitals and demographics
        X_imputed = self.imputer.fit_transform(X[cols])
        X_imputed = pd.DataFrame(X_imputed, columns=cols, index=X.index)
        
        # 4. Scale features
        X_scaled = self.scaler.fit_transform(X_imputed)
        X_scaled = pd.DataFrame(X_scaled, columns=cols, index=X.index)
        
        self.is_fitted = True
        
        # Return merged DataFrame containing everything needed
        return X_scaled

    def transform(self, df):
        """Transform new data using fitted preprocessor."""
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet!")
            
        X = df.copy()
        
        for col in SYMPTOM_COLS:
            if col in X.columns:
                X[col] = X[col].fillna(0)
                
        # Calculate shock index
        bp_sys = X['bp_sys'].copy()
        bp_sys[bp_sys < 1] = 1.0 
        X['shock_index'] = X['hr'] / bp_sys
        
        cols = [c for c in INPUT_FEATURES + DERIVED_FEATURES if c in X.columns]
        
        X_imputed = self.imputer.transform(X[cols])
        X_imputed = pd.DataFrame(X_imputed, columns=cols, index=X.index)
        
        X_scaled = self.scaler.transform(X_imputed)
        X_scaled = pd.DataFrame(X_scaled, columns=cols, index=X.index)
        
        return X_scaled
        
    def save(self, filepath):
        """Save preprocessor state."""
        with open(filepath, 'wb') as f:
            pickle.dump({'imputer': self.imputer, 'scaler': self.scaler, 'is_fitted': self.is_fitted}, f)
            
    def load(self, filepath):
        """Load preprocessor state."""
        with open(filepath, 'rb') as f:
            state = pickle.load(f)
            self.imputer = state['imputer']
            self.scaler = state['scaler']
            self.is_fitted = state['is_fitted']

def load_and_prep_data(filepath, test_size=0.2):
    """Load dataset, split into train/test, and preprocess."""
    df = pd.read_parquet(filepath)
    
    # Feature matrix and target
    X = df[INPUT_FEATURES]
    y_class = df['emergency_type_label'] # Classification target
    
    # Stratified split to keep classes balanced
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_class, test_size=test_size, random_state=42, stratify=y_class
    )
    
    # Fit and transform preprocessor
    preprocessor = Preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Save preprocessor for inference
    preprocessor.save(os.path.join(MODELS_DIR, 'preprocessor.pkl'))
    
    return X_train_proc, X_test_proc, y_train, y_test

if __name__ == "__main__":
    print("Testing Preprocessor...")
    X_train, X_test, y_train, y_test = load_and_prep_data(os.path.join(DATA_DIR, 'triage_dataset_v2.parquet'))
    print(f"X_train shape: {X_train.shape}")
    print(f"X_test shape: {X_test.shape}")
    print(f"y_train shape: {y_train.shape}")
    print("Preprocessor tested and saved successfully.")