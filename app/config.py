import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    
    # MySQL Configuration (Restored for FY Project Requirements)
    # Using 'localhost' as requested by the user
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'pw_db')
    
    # SQLAlchemy Configuration
    # If 'localhost' fails, try '127.0.0.1' in the .env file
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}@{MYSQL_HOST}/{MYSQL_DB}?charset=utf8mb4"
    if MYSQL_PASSWORD:
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}?charset=utf8mb4"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MYSQL_CURSORCLASS = 'DictCursor' # Maintaining for compatibility if needed
    MYSQL_CURSORCLASS = 'DictCursor'

    # Weather API Configuration
    WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY')
    WEATHER_API_URL = os.environ.get('WEATHER_API_URL')
