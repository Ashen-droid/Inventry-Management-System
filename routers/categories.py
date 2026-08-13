"""Categories router: CRUD."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db, Category, ActivityLog
from services.auth_service import get_current_user, require_admin
from database import User

router = APIRouter(prefix="/categories", tags=["Categories"])


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    category_id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Category).all()


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    return cat


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if db.query(Category).filter(Category.name == data.name).first():
        raise HTTPException(400, "Category name already exists")
    cat = Category(name=data.name, description=data.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    log = ActivityLog(user_id=current_user.user_id, action="CREATE_CATEGORY",
                      details=f"Created category: {cat.name}")
    db.add(log)
    db.commit()
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, data: CategoryCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    cat.name = data.name
    cat.description = data.description
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_admin)):
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    log = ActivityLog(user_id=current_user.user_id, action="DELETE_CATEGORY",
                      details=f"Deleted category: {cat.name}")
    db.add(log)
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}
