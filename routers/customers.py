"""Customers router: CRUD."""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List

from database import get_db, Customer, ActivityLog, User
from services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/customers", tags=["Customers"])


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class CustomerOut(BaseModel):
    customer_id: int
    name: str
    phone: Optional[str]
    email: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CustomerOut])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Customer).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    return c


@router.post("/", response_model=CustomerOut, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    c = Customer(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    db.add(ActivityLog(user_id=current_user.user_id, action="CREATE_CUSTOMER",
                       details=f"Created customer: {c.name}"))
    db.commit()
    return c


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, data: CustomerCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_admin)):
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    db.add(ActivityLog(user_id=current_user.user_id, action="DELETE_CUSTOMER",
                       details=f"Deleted customer: {c.name}"))
    db.delete(c)
    db.commit()
    return {"message": "Customer deleted"}
