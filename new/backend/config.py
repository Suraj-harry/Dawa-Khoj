import os

class Config:
    """Application configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = True
    
    # Data paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    
    # Dataset paths
    DATASET1_PATH = os.path.join(DATA_DIR, 'indian_medicine_data.csv')
    DATASET2_PATH = os.path.join(DATA_DIR, 'medicine_data.csv')
    PROCESSED_DATA_PATH = os.path.join(DATA_DIR, 'processed_medicines.json')
    
    # API settings
    CORS_HEADERS = 'Content-Type'
    MAX_RESULTS = 10
