"""AI Stock Prediction Service using scikit-learn Linear Regression."""
import numpy as np
from sklearn.linear_model import LinearRegression
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import SaleItem, Sale, Product
from sqlalchemy import func, extract
import datetime


def get_monthly_sales_data(db: Session, product_id: int) -> list[dict]:
    """Get monthly sales quantities for a product."""
    results = (
        db.query(
            extract("year",  Sale.sale_date).label("year"),
            extract("month", Sale.sale_date).label("month"),
            func.sum(SaleItem.quantity).label("total_qty")
        )
        .join(SaleItem, Sale.sale_id == SaleItem.sale_id)
        .filter(SaleItem.product_id == product_id)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    return [{"year": int(r.year), "month": int(r.month), "quantity": int(r.total_qty)} for r in results]


def predict_next_month_sales(db: Session, product_id: int) -> dict:
    """
    Use Linear Regression to predict next month's sales quantity.
    Returns: { prediction, trend, data_points, confidence }
    """
    data = get_monthly_sales_data(db, product_id)

    if len(data) < 2:
        return {
            "product_id": product_id,
            "prediction": None,
            "message": "Not enough historical data (need at least 2 months)",
            "data": data
        }

    # X = month index (1, 2, 3, ...), Y = quantity sold
    X = np.array(range(1, len(data) + 1)).reshape(-1, 1)
    Y = np.array([d["quantity"] for d in data])

    model = LinearRegression()
    model.fit(X, Y)

    next_month_idx = len(data) + 1
    prediction = max(0, round(model.predict([[next_month_idx]])[0]))

    trend = "increasing" if model.coef_[0] > 0 else "decreasing" if model.coef_[0] < 0 else "stable"
    r2_score = round(model.score(X, Y), 3)

    # Calculate next month name
    last = data[-1]
    next_dt = datetime.date(last["year"], last["month"], 1) + datetime.timedelta(days=32)
    next_dt = next_dt.replace(day=1)

    return {
        "product_id": product_id,
        "predicted_quantity": prediction,
        "next_month": next_dt.strftime("%B %Y"),
        "trend": trend,
        "confidence_r2": r2_score,
        "historical_data": data
    }


def get_fast_moving_products(db: Session, limit: int = 10) -> list[dict]:
    """Get top selling products by total quantity sold."""
    results = (
        db.query(
            Product.product_id,
            Product.name,
            Product.quantity,
            func.sum(SaleItem.quantity).label("total_sold")
        )
        .join(SaleItem, Product.product_id == SaleItem.product_id)
        .group_by(Product.product_id, Product.name, Product.quantity)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        {"product_id": r.product_id, "name": r.name, "stock": r.quantity, "total_sold": int(r.total_sold)}
        for r in results
    ]


def get_slow_moving_products(db: Session, limit: int = 10) -> list[dict]:
    """Get products with lowest sales or no sales at all."""
    # Products with sales
    sold_subq = (
        db.query(SaleItem.product_id, func.sum(SaleItem.quantity).label("total_sold"))
        .group_by(SaleItem.product_id)
        .subquery()
    )
    results = (
        db.query(Product.product_id, Product.name, Product.quantity,
                 func.coalesce(sold_subq.c.total_sold, 0).label("total_sold"))
        .outerjoin(sold_subq, Product.product_id == sold_subq.c.product_id)
        .filter(Product.is_active == True)
        .order_by(func.coalesce(sold_subq.c.total_sold, 0).asc())
        .limit(limit)
        .all()
    )
    return [
        {"product_id": r.product_id, "name": r.name, "stock": r.quantity, "total_sold": int(r.total_sold)}
        for r in results
    ]


def get_restock_recommendations(db: Session) -> list[dict]:
    """
    Smart restock: compare current stock vs average weekly sales.
    Recommend order quantity = (avg_weekly_sales * 4) - current_stock
    """
    four_weeks_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=4)

    results = (
        db.query(
            Product.product_id,
            Product.name,
            Product.quantity,
            Product.low_stock_threshold,
            func.sum(SaleItem.quantity).label("sold_last_4_weeks")
        )
        .join(SaleItem, Product.product_id == SaleItem.product_id)
        .join(Sale, Sale.sale_id == SaleItem.sale_id)
        .filter(Sale.sale_date >= four_weeks_ago, Product.is_active == True)
        .group_by(Product.product_id, Product.name, Product.quantity, Product.low_stock_threshold)
        .all()
    )

    recommendations = []
    for r in results:
        avg_weekly = (r.sold_last_4_weeks or 0) / 4
        recommended_stock = avg_weekly * 4  # 1 month supply
        if r.quantity < recommended_stock:
            order_qty = max(0, round(recommended_stock - r.quantity))
            recommendations.append({
                "product_id": r.product_id,
                "name": r.name,
                "current_stock": r.quantity,
                "avg_weekly_sales": round(avg_weekly, 1),
                "recommended_order": order_qty,
                "urgency": "HIGH" if r.quantity <= r.low_stock_threshold else "MEDIUM"
            })

    return sorted(recommendations, key=lambda x: x["urgency"] == "HIGH", reverse=True)
