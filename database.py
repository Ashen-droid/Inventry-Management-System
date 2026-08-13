# pyrefly: ignore [missing-import]
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    ForeignKey, DateTime, Boolean, Text, Enum
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, DeclarativeBase, relationship
import datetime
import enum

# ==========================================
# Database URL
# ==========================================
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:ashen2000@localhost:5432/inventory_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==========================================
# Base Class
# ==========================================
class Base(DeclarativeBase):
    pass


# ==========================================
# Enums
# ==========================================
class UserRole(str, enum.Enum):
    admin = "admin"
    employee = "employee"

class StockChangeType(str, enum.Enum):
    purchase = "purchase"
    sale = "sale"
    adjustment = "adjustment"


# ==========================================
# DB Dependency (use in routers)
# ==========================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# Model 1: Users
# ==========================================
class User(Base):
    __tablename__ = "users"

    user_id      = Column(Integer, primary_key=True, index=True)
    username     = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role         = Column(Enum(UserRole), default=UserRole.employee)
    email        = Column(String, unique=True, index=True)
    full_name    = Column(String)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sales        = relationship("Sale", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")


# ==========================================
# Model 2: Categories
# ==========================================
class Category(Base):
    __tablename__ = "categories"

    category_id  = Column(Integer, primary_key=True, index=True)
    name         = Column(String, unique=True, index=True, nullable=False)
    description  = Column(String)

    # Relationships
    products     = relationship("Product", back_populates="category")


# ==========================================
# Model 3: Suppliers
# ==========================================
class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id  = Column(Integer, primary_key=True, index=True)
    name         = Column(String, index=True, nullable=False)
    company      = Column(String)
    email        = Column(String, unique=True, index=True)
    phone        = Column(String)
    address      = Column(String)

    # Relationships
    products     = relationship("Product", back_populates="supplier")
    purchases    = relationship("Purchase", back_populates="supplier")


# ==========================================
# Model 4: Customers
# ==========================================
class Customer(Base):
    __tablename__ = "customers"

    customer_id  = Column(Integer, primary_key=True, index=True)
    name         = Column(String, index=True, nullable=False)
    phone        = Column(String)
    email        = Column(String, unique=True, index=True)

    # Relationships
    sales        = relationship("Sale", back_populates="customer")


# ==========================================
# Model 5: Products
# ==========================================
class Product(Base):
    __tablename__ = "products"

    product_id        = Column(Integer, primary_key=True, index=True)
    name              = Column(String, index=True, nullable=False)
    description       = Column(Text)
    price             = Column(Float, nullable=False)       # Selling price
    cost_price        = Column(Float)                       # Purchase cost
    quantity          = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)        # Alert when below this
    barcode           = Column(String, unique=True, index=True)
    barcode_image     = Column(String)                      # Path to barcode image
    qr_code_image     = Column(String)                      # Path to QR code image
    image_path        = Column(String)                      # Product photo
    is_active         = Column(Boolean, default=True)
    created_at        = Column(DateTime, default=datetime.datetime.utcnow)

    # Foreign Keys
    category_id       = Column(Integer, ForeignKey("categories.category_id"))
    supplier_id       = Column(Integer, ForeignKey("suppliers.supplier_id"))

    # Relationships
    category          = relationship("Category", back_populates="products")
    supplier          = relationship("Supplier", back_populates="products")
    sale_items        = relationship("SaleItem", back_populates="product")
    purchase_items    = relationship("PurchaseItem", back_populates="product")
    stock_history     = relationship("StockHistory", back_populates="product")


# ==========================================
# Model 6: Purchases (Supplier → Inventory)
# ==========================================
class Purchase(Base):
    __tablename__ = "purchases"

    purchase_id   = Column(Integer, primary_key=True, index=True)
    purchase_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_cost    = Column(Float, default=0.0)
    notes         = Column(Text)

    # Foreign Keys
    supplier_id   = Column(Integer, ForeignKey("suppliers.supplier_id"))

    # Relationships
    supplier      = relationship("Supplier", back_populates="purchases")
    items         = relationship("PurchaseItem", back_populates="purchase")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id            = Column(Integer, primary_key=True, index=True)
    quantity      = Column(Integer, nullable=False)
    cost_price    = Column(Float, nullable=False)

    # Foreign Keys
    purchase_id   = Column(Integer, ForeignKey("purchases.purchase_id"))
    product_id    = Column(Integer, ForeignKey("products.product_id"))

    # Relationships
    purchase      = relationship("Purchase", back_populates="items")
    product       = relationship("Product", back_populates="purchase_items")


# ==========================================
# Model 7: Sales (Inventory → Customer)
# ==========================================
class Sale(Base):
    __tablename__ = "sales"

    sale_id        = Column(Integer, primary_key=True, index=True)
    sale_date      = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount   = Column(Float, default=0.0)
    invoice_number = Column(String, unique=True, index=True)
    invoice_pdf    = Column(String)                # Path to PDF file
    notes          = Column(Text)

    # Foreign Keys
    customer_id    = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    user_id        = Column(Integer, ForeignKey("users.user_id"))

    # Relationships
    customer       = relationship("Customer", back_populates="sales")
    user           = relationship("User", back_populates="sales")
    items          = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id             = Column(Integer, primary_key=True, index=True)
    quantity       = Column(Integer, nullable=False)
    unit_price     = Column(Float, nullable=False)
    subtotal       = Column(Float)

    # Foreign Keys
    sale_id        = Column(Integer, ForeignKey("sales.sale_id"))
    product_id     = Column(Integer, ForeignKey("products.product_id"))

    # Relationships
    sale           = relationship("Sale", back_populates="items")
    product        = relationship("Product", back_populates="sale_items")


# ==========================================
# Model 8: Stock History
# ==========================================
class StockHistory(Base):
    __tablename__ = "stock_history"

    id              = Column(Integer, primary_key=True, index=True)
    change_type     = Column(Enum(StockChangeType))   # purchase / sale / adjustment
    quantity_change = Column(Integer)                  # +ve = added, -ve = removed
    quantity_after  = Column(Integer)                  # stock level after change
    date            = Column(DateTime, default=datetime.datetime.utcnow)
    note            = Column(String)

    # Foreign Keys
    product_id      = Column(Integer, ForeignKey("products.product_id"))

    # Relationships
    product         = relationship("Product", back_populates="stock_history")


# ==========================================
# Model 9: Activity Log
# ==========================================
class ActivityLog(Base):
    __tablename__ = "activity_log"

    id          = Column(Integer, primary_key=True, index=True)
    action      = Column(String, nullable=False)    # e.g. "LOGIN", "DELETE_PRODUCT"
    details     = Column(Text)
    ip_address  = Column(String)
    timestamp   = Column(DateTime, default=datetime.datetime.utcnow)

    # Foreign Keys
    user_id     = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    user        = relationship("User", back_populates="activity_logs")