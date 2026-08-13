"""AI/ML router: Stock prediction, fast/slow movers, restock recommendations."""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from database import get_db, User
from services.auth_service import get_current_user
from services import ai_service

router = APIRouter(prefix="/ai", tags=["AI & Predictions"])


@router.get("/predict/{product_id}")
def predict_sales(product_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    """Predict next month's sales for a product using Linear Regression."""
    return ai_service.predict_next_month_sales(db, product_id)


@router.get("/fast-moving")
def fast_moving(limit: int = 10, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """Top selling products (fast movers)."""
    return ai_service.get_fast_moving_products(db, limit)


@router.get("/slow-moving")
def slow_moving(limit: int = 10, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """Lowest selling products (slow movers)."""
    return ai_service.get_slow_moving_products(db, limit)


@router.get("/restock-recommendations")
def restock(db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)):
    """Smart restock recommendations based on sales velocity."""
    return ai_service.get_restock_recommendations(db)
