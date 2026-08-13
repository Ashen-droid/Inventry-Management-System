# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from database import Base, engine
from database import engine, Base
import database

# Create all tables in the database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Inventory System API is running!"}

# Me line eken thamai database eke tables tika hadanne
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Inventory System API is running!"}