# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse

from database import Base, engine

# Import all routers
from routers import auth, categories, suppliers, customers, products
from routers import purchases, sales, dashboard, reports, ai, activity_log

# ==========================================
# Create all DB tables automatically
# ==========================================
Base.metadata.create_all(bind=engine)

# ==========================================
# FastAPI App
# ==========================================
app = FastAPI(
    title="Inventory Management System API",
    description="Full-featured Inventory System with AI Stock Prediction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==========================================
# CORS (allow frontend to talk to API)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Static Files (product images, barcodes, etc.)
# ==========================================
import os
os.makedirs("static", exist_ok=True)
os.makedirs("frontend", exist_ok=True)

app.mount("/static",   StaticFiles(directory="static"),   name="static")
app.mount("/frontend", StaticFiles(directory="frontend"),  name="frontend")

# ==========================================
# Include Routers
# ==========================================
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(purchases.router)
app.include_router(sales.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(activity_log.router)

# ==========================================
# Root → Serve Login Page
# ==========================================
@app.get("/")
def serve_index():
    return FileResponse("frontend/index.html")

@app.get("/health")
def health():
    return {"status": "ok", "message": "Inventory System API is running!"}