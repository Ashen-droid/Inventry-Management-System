# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from database import Base, engine

# Create all tables in the database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Inventory System API is running!"}
