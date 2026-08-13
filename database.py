# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, Column, Integer, String, Float
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, DeclarativeBase
# pyrefly: ignore [missing-import]
from sqlalchemy import ForeignKey 

# Database URL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:ashen2000@localhost:5432/inventory_db"

# Engine: Python's connection to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal: used to handle transactions when reading/writing data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for defining ORM models (modern SQLAlchemy style)
class Base(DeclarativeBase):
    pass

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer)

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    email = Column(String, unique=True, index=True)

class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    company = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String)

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)



class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer)
    
    # Foreign Keys
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"))