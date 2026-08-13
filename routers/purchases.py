"""Purchases router: Create purchase, auto-increment stock."""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime

from database import get_db, Purchase, PurchaseItem, Product, StockHistory, ActivityLog, User
from services.auth_service import get_current_user

router = APIRouter(prefix="/purchases", tags=["Purchases"])


# ── Schemas ──────────────────────────────────────────────
class PurchaseItemIn(BaseModel):
    product_id: int
    quantity: int
    cost_price: float


class PurchaseCreate(BaseModel):
    supplier_id: int
    notes: Optional[str] = None
    items: List[PurchaseItemIn]


class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    cost_price: float

    class Config:
        from_attributes = True


class PurchaseOut(BaseModel):
    purchase_id: int
    supplier_id: int
    purchase_date: datetime.datetime
    total_cost: float
    notes: Optional[str]
    items: List[PurchaseItemOut]

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────
@router.get("/", response_model=List[PurchaseOut])
def get_purchases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Purchase).order_by(Purchase.purchase_date.desc()).all()


@router.get("/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    p = db.query(Purchase).filter(Purchase.purchase_id == purchase_id).first()
    if not p:
        raise HTTPException(404, "Purchase not found")
    return p


@router.post("/", response_model=PurchaseOut, status_code=201)
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    total_cost = sum(item.quantity * item.cost_price for item in data.items)

    purchase = Purchase(
        supplier_id=data.supplier_id,
        total_cost=total_cost,
        notes=data.notes,
    )
    db.add(purchase)
    db.flush()  # Get purchase_id before commit

    for item_data in data.items:
        product = db.query(Product).filter(Product.product_id == item_data.product_id).first()
        if not product:
            raise HTTPException(404, f"Product {item_data.product_id} not found")

        # Create purchase item
        purchase_item = PurchaseItem(
            purchase_id=purchase.purchase_id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            cost_price=item_data.cost_price,
        )
        db.add(purchase_item)

        # ✅ Auto-increment stock
        product.quantity += item_data.quantity

        # Log stock change
        db.add(StockHistory(
            product_id=item_data.product_id,
            change_type="purchase",
            quantity_change=+item_data.quantity,
            quantity_after=product.quantity,
            note=f"Purchase #{purchase.purchase_id}",
        ))

    db.commit()
    db.refresh(purchase)

    db.add(ActivityLog(user_id=current_user.user_id, action="CREATE_PURCHASE",
                       details=f"Purchase #{purchase.purchase_id} - Rs.{total_cost:,.2f}"))
    db.commit()
    return purchase
