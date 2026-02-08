"""Initialize database - create budgetme database if it doesn't exist."""

import time
import pyodbc
from app.config.database_config import DatabaseConfig


def create_database_if_not_exists():
    """Create the budgetme database if it doesn't exist."""
    config = DatabaseConfig()
    
    # Connection string to master database (without specific database)
    connection_string = (
        f"DRIVER={{{config.driver}}};"
        f"SERVER={config.server},{config.port};"
        f"UID={config.username};"
        f"PWD={config.password};"
        f"TrustServerCertificate=yes;"
        f"Database=master"
    )
    
    max_retries = 10
    retry_delay = 3
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to SQL Server (attempt {attempt + 1}/{max_retries})...")
            conn = pyodbc.connect(connection_string, timeout=30, autocommit=True)
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute(
                "SELECT name FROM sys.databases WHERE name = ?",
                (config.database,)
            )
            
            if cursor.fetchone() is None:
                print(f"Database '{config.database}' does not exist. Creating...")
                cursor.execute(f"CREATE DATABASE {config.database}")
                print(f"Database '{config.database}' created successfully!")
            else:
                print(f"Database '{config.database}' already exists.")
            
            cursor.close()
            conn.close()
            return True
            
        except pyodbc.Error as e:
            print(f"Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Failed to initialize database.")
                return False


if __name__ == "__main__":
    create_database_if_not_exists()
