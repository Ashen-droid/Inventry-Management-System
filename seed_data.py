"""
Seed script: Mobile Shop - Add 5 categories and 3 suppliers.
Run: python seed_data.py
"""
from sqlalchemy import text
from database import SessionLocal

db = SessionLocal()

# ─── 5 Mobile Shop Categories ────────────────────────────────────
categories = [
    ("Smartphones",      "Android and iOS mobile phones"),
    ("Accessories",      "Cases, covers, screen guards and more"),
    ("Chargers & Cables","Chargers, USB cables, adapters"),
    ("Earphones & Audio","Wired and wireless earphones, speakers"),
    ("Spare Parts",      "Batteries, screens, flex cables and components"),
]

added_cats = 0
for name, desc in categories:
    result = db.execute(text("SELECT category_id FROM categories WHERE name = :name"), {"name": name}).fetchone()
    if not result:
        db.execute(
            text("INSERT INTO categories (name, description) VALUES (:name, :desc)"),
            {"name": name, "desc": desc}
        )
        added_cats += 1
        print(f"  [OK] Category added: {name}")
    else:
        print(f"  [SKIP] Category already exists: {name}")

db.commit()

# ─── 3 Mobile Shop Suppliers ─────────────────────────────────────
suppliers = [
    ("Samsung Distributor",  "Samsung India Electronics Pvt Ltd", "supply@samsung-dist.com",  "9876543210", "12 Electronics Hub, Chennai"),
    ("Mobile Zone Wholesale","Mobile Zone Pvt Ltd",               "orders@mobilezone.com",     "9123456789", "88 Nehru Street, Coimbatore"),
    ("Redmi & Xiaomi Dealer","Xiaomi Authorized Distributor",     "sales@xiaomi-dealer.com",   "9988776655", "34 Tech Park, Bangalore"),
]

added_sups = 0
for name, company, email, phone, address in suppliers:
    result = db.execute(text("SELECT supplier_id FROM suppliers WHERE email = :email"), {"email": email}).fetchone()
    if not result:
        db.execute(
            text("INSERT INTO suppliers (name, company, email, phone, address) VALUES (:name, :company, :email, :phone, :address)"),
            {"name": name, "company": company, "email": email, "phone": phone, "address": address}
        )
        added_sups += 1
        print(f"  [OK] Supplier added: {name}")
    else:
        print(f"  [SKIP] Supplier already exists: {name}")

db.commit()
db.close()

print(f"\nDone! Added {added_cats} categories and {added_sups} suppliers.")
