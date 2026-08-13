"""Sales router: Create sale, auto-decrement stock, generate PDF invoice."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime, uuid

from database import get_db, Sale, SaleItem, Product, StockHistory, ActivityLog, User
from services.auth_service import get_current_user
from services.invoice_service import generate_invoice_pdf

router = APIRouter(prefix="/sales", tags=["Sales"])


# ── Schemas ──────────────────────────────────────────────
class SaleItemIn(BaseModel):
    product_id: int
    quantity: int


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    notes: Optional[str] = None
    items: List[SaleItemIn]


class SaleItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class SaleOut(BaseModel):
    sale_id: int
    customer_id: Optional[int]
    user_id: int
    sale_date: datetime.datetime
    total_amount: float
    invoice_number: str
    invoice_pdf: Optional[str]
    notes: Optional[str]
    items: List[SaleItemOut]

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────
@router.get("/", response_model=List[SaleOut])
def get_sales(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Sale).order_by(Sale.sale_date.desc()).all()


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    s = db.query(Sale).filter(Sale.sale_id == sale_id).first()
    if not s:
        raise HTTPException(404, "Sale not found")
    return s


@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    invoice_number = f"INV-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    sale = Sale(
        customer_id=data.customer_id,
        user_id=current_user.user_id,
        invoice_number=invoice_number,
        notes=data.notes,
        total_amount=0,
    )
    db.add(sale)
    db.flush()

    total = 0.0
    invoice_items = []

    for item_data in data.items:
        product = db.query(Product).filter(Product.product_id == item_data.product_id,
                                           Product.is_active == True).first()
        if not product:
            raise HTTPException(404, f"Product {item_data.product_id} not found")
        if product.quantity < item_data.quantity:
            raise HTTPException(400, f"Insufficient stock for '{product.name}'. "
                                     f"Available: {product.quantity}, Requested: {item_data.quantity}")

        subtotal = product.price * item_data.quantity

        sale_item = SaleItem(
            sale_id=sale.sale_id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=product.price,
            subtotal=subtotal,
        )
        db.add(sale_item)

        # ✅ Auto-decrement stock
        product.quantity -= item_data.quantity

        # Stock history
        db.add(StockHistory(
            product_id=item_data.product_id,
            change_type="sale",
            quantity_change=-item_data.quantity,
            quantity_after=product.quantity,
            note=f"Sale #{sale.sale_id} / Invoice {invoice_number}",
        ))

        total += subtotal
        invoice_items.append({
            "name": product.name,
            "quantity": item_data.quantity,
            "unit_price": product.price,
            "subtotal": subtotal,
        })

    sale.total_amount = total
    db.flush()

    # Generate PDF invoice
    customer = sale.customer
    pdf_data = {
        "invoice_number": invoice_number,
        "sale_date": sale.sale_date.strftime("%Y-%m-%d %H:%M"),
        "user_name": current_user.full_name or current_user.username,
        "customer_name": customer.name if customer else "Walk-in Customer",
        "customer_phone": customer.phone if customer else None,
        "customer_email": customer.email if customer else None,
        "items": invoice_items,
        "total_amount": total,
    }
    try:
        pdf_path = generate_invoice_pdf(pdf_data)
        sale.invoice_pdf = pdf_path
    except Exception as e:
        print(f"Invoice PDF error: {e}")

    db.commit()
    db.refresh(sale)

    db.add(ActivityLog(user_id=current_user.user_id, action="CREATE_SALE",
                       details=f"Sale #{sale.sale_id} Invoice {invoice_number} - Rs.{total:,.2f}"))
    db.commit()
    return sale


@router.get("/{sale_id}/invoice")
def download_invoice(sale_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    s = db.query(Sale).filter(Sale.sale_id == sale_id).first()
    if not s or not s.invoice_pdf:
        raise HTTPException(404, "Invoice not found")
    return FileResponse(s.invoice_pdf, media_type="application/pdf",
                        filename=f"invoice_{s.invoice_number}.pdf")
