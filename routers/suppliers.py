"""Suppliers router: CRUD."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from database import get_db, Supplier, ActivityLog, User
from services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


class SupplierCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierOut(BaseModel):
    supplier_id: int
    name: str
    company: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Supplier).all()


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not s:
        raise HTTPException(404, "Supplier not found")
    return s


@router.post("/", response_model=SupplierOut, status_code=201)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    s = Supplier(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    db.add(ActivityLog(user_id=current_user.user_id, action="CREATE_SUPPLIER",
                       details=f"Created supplier: {s.name}"))
    db.commit()
    return s


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, data: SupplierCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not s:
        raise HTTPException(404, "Supplier not found")
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_admin)):
    s = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not s:
        raise HTTPException(404, "Supplier not found")
    db.add(ActivityLog(user_id=current_user.user_id, action="DELETE_SUPPLIER",
                       details=f"Deleted supplier: {s.name}"))
    db.delete(s)
    db.commit()
    return {"message": "Supplier deleted"}
