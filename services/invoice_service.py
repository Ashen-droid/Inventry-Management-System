"""PDF Invoice generation service using ReportLab."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
import os, datetime

INVOICE_DIR = "static/invoices"
os.makedirs(INVOICE_DIR, exist_ok=True)


def generate_invoice_pdf(sale: dict) -> str:
    """
    Generate a PDF invoice and return the file path.
    sale dict keys:
      invoice_number, sale_date, customer_name, customer_phone, customer_email,
      items: [{name, quantity, unit_price, subtotal}],
      total_amount, user_name
    """
    filename = f"{INVOICE_DIR}/invoice_{sale['invoice_number']}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    story  = []

    # ── Title ──────────────────────────────────────
    title_style = ParagraphStyle("title", parent=styles["Title"],
                                 fontSize=24, textColor=colors.HexColor("#1a237e"),
                                 spaceAfter=6)
    sub_style   = ParagraphStyle("sub", parent=styles["Normal"],
                                 fontSize=10, textColor=colors.grey)

    story.append(Paragraph("INVENTORY SYSTEM", title_style))
    story.append(Paragraph("Professional Inventory Management", sub_style))
    story.append(Spacer(1, 0.5*cm))

    # ── Invoice Info ────────────────────────────────
    info_data = [
        ["INVOICE", f"#{sale['invoice_number']}"],
        ["Date", sale['sale_date']],
        ["Billed By", sale.get('user_name', 'System')],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1a237e")),
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE",  (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3*cm))

    # ── Customer Info ──────────────────────────────
    if sale.get("customer_name"):
        story.append(Paragraph("<b>Bill To:</b>", styles["Normal"]))
        story.append(Paragraph(sale.get("customer_name", "Walk-in Customer"), styles["Normal"]))
        if sale.get("customer_phone"):
            story.append(Paragraph(sale["customer_phone"], styles["Normal"]))
        if sale.get("customer_email"):
            story.append(Paragraph(sale["customer_email"], styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    # ── Items Table ────────────────────────────────
    headers = ["#", "Product", "Qty", "Unit Price", "Subtotal"]
    rows = [headers]
    for i, item in enumerate(sale["items"], 1):
        rows.append([
            str(i),
            item["name"],
            str(item["quantity"]),
            f"Rs. {item['unit_price']:,.2f}",
            f"Rs. {item['subtotal']:,.2f}",
        ])

    col_widths = [1*cm, 8*cm, 2*cm, 3.5*cm, 3.5*cm]
    items_table = Table(rows, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#1a237e")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("ALIGN",         (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN",         (0, 0), (1, -1), "LEFT"),
        # Alternating rows
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
        ("TOPPADDING",     (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.4*cm))

    # ── Total ──────────────────────────────────────
    total_data = [["", "", "", "TOTAL:", f"Rs. {sale['total_amount']:,.2f}"]]
    total_table = Table(total_data, colWidths=col_widths)
    total_table.setStyle(TableStyle([
        ("FONTNAME",   (3, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (3, 0), (-1, 0), 12),
        ("TEXTCOLOR",  (3, 0), (-1, 0), colors.HexColor("#1a237e")),
        ("ALIGN",      (3, 0), (-1, 0), "RIGHT"),
        ("LINEABOVE",  (3, 0), (-1, 0), 1.5, colors.HexColor("#1a237e")),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 1*cm))

    # ── Footer ─────────────────────────────────────
    footer_style = ParagraphStyle("footer", parent=styles["Normal"],
                                  fontSize=9, textColor=colors.grey,
                                  alignment=TA_CENTER)
    story.append(Paragraph("Thank you for your business!", footer_style))
    story.append(Paragraph("Generated by Inventory Management System", footer_style))

    doc.build(story)
    return filename
