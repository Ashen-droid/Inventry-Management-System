"""Script to create the inventory_db database if it doesn't exist."""
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

# Connect to the default 'postgres' database first
engine = create_engine("postgresql://postgres:ashen2000@localhost:5432/postgres", isolation_level="AUTOCOMMIT")

with engine.connect() as conn:
    # Check if inventory_db already exists
    result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='inventory_db'"))
    if result.fetchone():
        print("✅ Database 'inventory_db' already exists!")
    else:
        conn.execute(text("CREATE DATABASE inventory_db"))
        print("✅ Database 'inventory_db' created successfully!")

engine.dispose()
