"""Dashboard router: Stats + Graph data."""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import datetime

from database import (get_db, Product, Sale, SaleItem, Purchase,
                      PurchaseItem, User, ActivityLog)
from services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Main dashboard stats."""
    today   = datetime.date.today()
    month_start = today.replace(day=1)

    total_products  = db.query(Product).filter(Product.is_active == True).count()
    low_stock_items = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity <= Product.low_stock_threshold,
        Product.quantity > 0
    ).count()
    out_of_stock = db.query(Product).filter(
        Product.is_active == True, Product.quantity == 0
    ).count()

    # Today's sales
    today_sales = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.sale_date) == today
    ).scalar() or 0.0

    # Monthly revenue
    monthly_revenue = db.query(func.sum(Sale.total_amount)).filter(
        Sale.sale_date >= datetime.datetime.combine(month_start, datetime.time.min)
    ).scalar() or 0.0

    # Monthly cost (purchases this month)
    monthly_cost = db.query(func.sum(Purchase.total_cost)).filter(
        Purchase.purchase_date >= datetime.datetime.combine(month_start, datetime.time.min)
    ).scalar() or 0.0

    return {
        "total_products":   total_products,
        "low_stock_items":  low_stock_items,
        "out_of_stock":     out_of_stock,
        "today_sales":      round(today_sales, 2),
        "monthly_revenue":  round(monthly_revenue, 2),
        "monthly_profit":   round(monthly_revenue - monthly_cost, 2),
    }


@router.get("/low-stock-products")
def get_low_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List of low stock / out of stock products for dashboard alert."""
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity <= Product.low_stock_threshold
    ).order_by(Product.quantity.asc()).all()

    return [
        {
            "product_id": p.product_id,
            "name": p.name,
            "quantity": p.quantity,
            "threshold": p.low_stock_threshold,
            "status": "OUT_OF_STOCK" if p.quantity == 0 else "LOW_STOCK",
        }
        for p in products
    ]


@router.get("/monthly-sales-chart")
def monthly_sales_chart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Last 12 months sales data for chart."""
    results = (
        db.query(
            extract("year",  Sale.sale_date).label("year"),
            extract("month", Sale.sale_date).label("month"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.sale_id).label("orders"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(12)
        .all()
    )

    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {
            "label": f"{months[int(r.month)-1]} {int(r.year)}",
            "revenue": round(float(r.revenue), 2),
            "orders": int(r.orders),
        }
        for r in results
    ]


@router.get("/category-sales-chart")
def category_sales_chart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Sales breakdown by category for pie chart."""
    from database import Category
    results = (
        db.query(
            Category.name,
            func.sum(SaleItem.subtotal).label("total")
        )
        .join(Product, Product.category_id == Category.category_id)
        .join(SaleItem, SaleItem.product_id == Product.product_id)
        .group_by(Category.name)
        .order_by(func.sum(SaleItem.subtotal).desc())
        .all()
    )
    return [{"category": r.name, "total": round(float(r.total), 2)} for r in results]


@router.get("/recent-transactions")
def recent_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Last 10 sales for dashboard."""
    sales = db.query(Sale).order_by(Sale.sale_date.desc()).limit(10).all()
    return [
        {
            "sale_id": s.sale_id,
            "invoice_number": s.invoice_number,
            "total_amount": s.total_amount,
            "sale_date": s.sale_date.isoformat(),
            "customer": s.customer.name if s.customer else "Walk-in",
            "items_count": len(s.items),
        }
        for s in sales
    ]
