#!/usr/bin/env python3
"""
send-pdfs-email.py — Envía los PDFs de auditoría/dossier a carlosgalera2roman@gmail.com.

Uso:
    GMAIL_APP_PASSWORD='xxxx xxxx xxxx xxxx' python3 scripts/send-pdfs-email.py

La GMAIL_APP_PASSWORD se obtiene en:
    Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación

Si ya configuraste el secret de Firebase para `dailyBalanceCheck`, puedes
recuperarlo con:
    firebase functions:secrets:access GMAIL_APP_PASSWORD
"""

import os
import sys
import smtplib
from email.message import EmailMessage
from pathlib import Path

# ─── Configuración ────────────────────────────────────────────────
GMAIL_USER = "carlosgalera2roman@gmail.com"
RECIPIENT = "carlosgalera2roman@gmail.com"

REPO_ROOT = Path(__file__).resolve().parent.parent
PDFS_DIR = REPO_ROOT / "docs" / "pdfs"

PDFS_TO_SEND = [
    {
        "filename": "auditoria-costes-cartagenaeste-blaze-2026-04-29.pdf",
        "description": "Auditoría de costes con Blaze activo (escenarios actual/500/1000 DAU)",
    },
    {
        "filename": "dossier-cartagenaeste-2026-04-29.pdf",
        "description": "Dossier completo: legal · módulo paciente · concursos · certificaciones · estrategia comercial",
    },
]

SUBJECT = "📚 Cartagenaeste · Auditoría de costes (Blaze) + Dossier completo · 2026-04-29"

BODY_HTML = """<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg,#0f6b4a,#1a6b4a); padding: 16px 22px; border-radius: 8px; color: #fff; margin-bottom: 18px;">
    <h2 style="margin: 0; font-size: 1.1rem;">📚 Documentos auto-generados Cartagenaeste</h2>
    <div style="font-size: 0.85rem; color: #d1fae5; margin-top: 4px;">2026-04-29 · v1.0</div>
  </div>

  <p>Hola Carlos,</p>
  <p>Adjuntos los PDFs generados en la sesión Claude Code:</p>

  <ol style="line-height:1.8;font-size:.92rem">
    <li><strong>Auditoría de costes</strong> (Blaze activo) — escenarios uso actual / 500 DAU / 1000 DAU + guía Firebase Billing.</li>
    <li><strong>Dossier completo</strong> — auditoría legal · módulo paciente (TA/glucemia) · concursos · certificaciones (incluye Rafalafena) · estrategia comercial Supuesto 1 (SMS) y Supuesto 2 (otros mercados) · vender módulos por separado (Evidencia BUA · OpenEvidence) · hoja de ruta 12 meses.</li>
  </ol>

  <div style="background:#fef9c3;border-left:4px solid #d97706;padding:12px 16px;border-radius:6px;margin:14px 0;font-size:.85rem">
    <strong>📤 Para Alex IA:</strong> el dossier completo es el documento ideal para enviar como input.
    Cubre todos los aspectos de la auditoría sin exponer el código fuente.
  </div>

  <p style="font-size:.78rem;color:#6b7280;margin-top:20px">
    Este email lo ha enviado el script <code>scripts/send-pdfs-email.py</code>.
    Documentos disponibles también en <code>docs/pdfs/</code> del repositorio.
  </p>
</body>
</html>"""

BODY_TEXT = """Adjuntos los PDFs auto-generados Cartagenaeste 2026-04-29:

1. Auditoría de costes (Blaze activo) — uso actual / 500 DAU / 1000 DAU + Firebase Billing guide.
2. Dossier completo — legal · módulo paciente · concursos · certificaciones · estrategia comercial · módulos vendibles · hoja de ruta.

Para Alex IA: el dossier completo es el documento ideal de input.
Documentos también en docs/pdfs/ del repo.
"""


def main() -> int:
    password = os.environ.get("GMAIL_APP_PASSWORD")
    if not password:
        print("❌ Falta variable GMAIL_APP_PASSWORD")
        print("\nEjecuta:")
        print("    GMAIL_APP_PASSWORD='xxxx xxxx xxxx xxxx' python3 scripts/send-pdfs-email.py")
        print("\nObtén la contraseña en:")
        print("    Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación")
        return 1

    # Verificar que los PDFs existen
    missing = []
    for pdf_meta in PDFS_TO_SEND:
        pdf_path = PDFS_DIR / pdf_meta["filename"]
        if not pdf_path.exists():
            missing.append(pdf_path)
    if missing:
        print("❌ PDFs no encontrados:")
        for m in missing:
            print(f"    {m}")
        print("\nGenera los PDFs primero con Chrome headless:")
        print('    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\')
        print("        --headless --disable-gpu --print-to-pdf=docs/pdfs/<nombre>.pdf \\")
        print("        --no-pdf-header-footer file:///path/to/docs/<nombre>.html")
        return 2

    # Construir mensaje
    msg = EmailMessage()
    msg["From"] = f"Cartagenaeste Generator <{GMAIL_USER}>"
    msg["To"] = RECIPIENT
    msg["Subject"] = SUBJECT
    msg.set_content(BODY_TEXT)
    msg.add_alternative(BODY_HTML, subtype="html")

    # Adjuntar PDFs
    for pdf_meta in PDFS_TO_SEND:
        pdf_path = PDFS_DIR / pdf_meta["filename"]
        with open(pdf_path, "rb") as f:
            data = f.read()
        msg.add_attachment(
            data,
            maintype="application",
            subtype="pdf",
            filename=pdf_meta["filename"],
        )
        size_mb = len(data) / 1024 / 1024
        print(f"📎 Adjuntado: {pdf_meta['filename']} ({size_mb:.1f} MB) — {pdf_meta['description']}")

    # Enviar
    print(f"\n📤 Enviando a {RECIPIENT}…")
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(GMAIL_USER, password)
            smtp.send_message(msg)
        print("✅ Email enviado correctamente.")
        return 0
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Error de autenticación: {e}")
        print("Verifica que GMAIL_APP_PASSWORD es una App Password (16 caracteres, sin espacios).")
        return 3
    except Exception as e:
        print(f"❌ Error: {e}")
        return 4


if __name__ == "__main__":
    sys.exit(main())
