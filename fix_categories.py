"""
Cleanup script: Keep only 'Electronics' category, remove all others.
Run: python fix_categories.py
"""
from sqlalchemy import text
from database import SessionLocal

db = SessionLocal()

# Get all categories
rows = db.execute(text("SELECT category_id, name FROM categories")).fetchall()

print("Current categories in DB:")
for row in rows:
    print(f"  ID={row[0]}  Name={row[1]}")

print()

# Delete all except Electronics
deleted = 0
for row in rows:
    if row[1] != "Electronics":
        try:
            # Set products using this category to NULL first (to avoid FK error)
            db.execute(text("UPDATE products SET category_id = NULL WHERE category_id = :id"), {"id": row[0]})
            db.execute(text("DELETE FROM categories WHERE category_id = :id"), {"id": row[0]})
            deleted += 1
            print(f"  [REMOVED] {row[1]}")
        except Exception as e:
            print(f"  [ERROR] Could not remove {row[1]}: {e}")
            db.rollback()

db.commit()
db.close()

print(f"\nDone! Removed {deleted} categories. Only 'Electronics' remains.")
