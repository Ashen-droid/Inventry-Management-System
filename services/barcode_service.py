"""Barcode and QR Code generation service."""
import qrcode
# pyrefly: ignore [missing-import]
import barcode
# pyrefly: ignore [missing-import]
from barcode.writer import ImageWriter
# pyrefly: ignore [missing-import]
from PIL import Image
import io, os, uuid

BARCODE_DIR = "static/barcodes"
QRCODE_DIR  = "static/qrcodes"

os.makedirs(BARCODE_DIR, exist_ok=True)
os.makedirs(QRCODE_DIR,  exist_ok=True)


def generate_barcode(barcode_value: str) -> str:
    """Generate a Code128 barcode image and return the file path."""
    filename = f"{BARCODE_DIR}/{barcode_value}"
    try:
        code = barcode.get("code128", barcode_value, writer=ImageWriter())
        saved = code.save(filename)
        return saved  # returns path with extension
    except Exception as e:
        print(f"Barcode generation error: {e}")
        return ""


def generate_qrcode(product_id: int, product_name: str) -> str:
    """Generate a QR code for a product and return the file path."""
    data = f"PRODUCT_ID:{product_id}|NAME:{product_name}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    filename = f"{QRCODE_DIR}/product_{product_id}.png"
    img.save(filename)
    return filename


def generate_unique_barcode() -> str:
    """Generate a unique barcode number."""
    return str(uuid.uuid4().int)[:13]  # 13-digit EAN-like number
