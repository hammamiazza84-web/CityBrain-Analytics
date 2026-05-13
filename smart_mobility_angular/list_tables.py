from sqlalchemy import create_engine
import urllib.parse
import pandas as pd

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=LAPTOP-53JPQ5UR;DATABASE=ETL;Trusted_Connection=yes;TrustServerCertificate=yes;'
engine = create_engine('mssql+pyodbc:///?odbc_connect=' + urllib.parse.quote_plus(conn_str))

try:
    with engine.connect() as conn:
        tables = pd.read_sql("SELECT table_name FROM information_schema.tables", conn)
        print("TABLES FOUND:")
        print(tables)
except Exception as e:
    print(f"ERROR: {e}")
