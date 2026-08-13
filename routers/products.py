"""Products router: Full CRUD + Image upload + Barcode + QR Code + Search."""
import os, shutil
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db, Product, ActivityLog, User
from services.auth_service import get_current_user, require_admin
from services.barcode_service import generate_barcode, generate_qrcode, generate_unique_barcode

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "static/product_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ──────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    quantity: int = 0
    low_stock_threshold: int = 5
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductOut(BaseModel):
    product_id: int
    name: str
    description: Optional[str]
    price: float
    cost_price: Optional[float]
    quantity: int
    low_stock_threshold: int
    barcode: Optional[str]
    barcode_image: Optional[str]
    qr_code_image: Optional[str]
    image_path: Optional[str]
    is_active: bool
    category_id: Optional[int]
    supplier_id: Optional[int]

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────
@router.get("/", response_model=List[ProductOut])
def get_products(
    search: Optional[str] = Query(None, description="Search by name or barcode"),
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Product).filter(Product.is_active == True)
    if search:
        q = q.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if supplier_id:
        q = q.filter(Product.supplier_id == supplier_id)
    if low_stock:
        q = q.filter(Product.quantity <= Product.low_stock_threshold)
    return q.all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@router.post("/", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    # Generate barcode if not provided
    barcode_val = data.barcode or generate_unique_barcode()

    p = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        cost_price=data.cost_price,
        quantity=data.quantity,
        low_stock_threshold=data.low_stock_threshold,
        barcode=barcode_val,
        category_id=data.category_id,
        supplier_id=data.supplier_id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    # Generate barcode image + QR code
    try:
        barcode_img = generate_barcode(barcode_val)
        qr_img      = generate_qrcode(p.product_id, p.name)
        p.barcode_image = barcode_img
        p.qr_code_image = qr_img
        db.commit()
        db.refresh(p)
    except Exception as e:
        print(f"Code generation error: {e}")

    db.add(ActivityLog(user_id=current_user.user_id, action="CREATE_PRODUCT",
                       details=f"Created product: {p.name}"))
    db.commit()
    return p


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    db.add(ActivityLog(user_id=current_user.user_id, action="UPDATE_PRODUCT",
                       details=f"Updated product: {p.name}"))
    db.commit()
    return p


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(require_admin)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    p.is_active = False   # Soft delete
    db.add(ActivityLog(user_id=current_user.user_id, action="DELETE_PRODUCT",
                       details=f"Deleted product: {p.name}"))
    db.commit()
    return {"message": "Product deleted"}


@router.post("/{product_id}/upload-image")
def upload_product_image(product_id: int, file: UploadFile = File(...),
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")

    ext      = os.path.splitext(file.filename)[1]
    filename = f"{UPLOAD_DIR}/product_{product_id}{ext}"
    with open(filename, "wb") as f:
        shutil.copyfileobj(file.file, f)

    p.image_path = filename
    db.commit()
    return {"image_path": filename}


@router.get("/{product_id}/barcode-image")
def get_barcode_image(product_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p or not p.barcode_image:
        raise HTTPException(404, "Barcode not found")
    return FileResponse(p.barcode_image)


@router.get("/{product_id}/qr-image")
def get_qr_image(product_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p or not p.qr_code_image:
        raise HTTPException(404, "QR code not found")
    return FileResponse(p.qr_code_image)
