import os
import shutil
from fastapi import FastAPI, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="Document Converter API (Render)")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "/tmp/conversions" if os.name != 'nt' else "temp_conversions"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/ping")
async def ping():
    return {"status": "awake", "message": "Server is awake and ready!"}

@app.post("/api/html-to-pdf")
async def html_to_pdf(html: str = Form(...)):
    """
    Accepts raw HTML content and converts it to a pixel-perfect PDF
    using WeasyPrint. Lightweight, no browser needed, perfect for
    Render free tier (512MB RAM).
    
    The CSS styling matches the Word export exactly:
    - Times New Roman, 12pt, line-height 1.6, justify
    - H1: 14pt, bold, centered, uppercase
    - H2: 12pt, bold, uppercase, left
    - A4 page size with 1-inch (2.54cm) margins
    """
    job_id = str(uuid.uuid4())
    output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Build a full HTML document with styling that matches Word export
        full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {{
            size: A4;
            margin: 2.54cm;
        }}
        body {{
            font-family: 'Times New Roman', 'Liberation Serif', serif;
            font-size: 12pt;
            line-height: 1.6;
            text-align: justify;
            color: #000;
            margin: 0;
            padding: 0;
        }}
        h1 {{
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-top: 18pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
        }}
        h2 {{
            font-size: 12pt;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
            margin-top: 18pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }}
        h3, h4, h5, h6 {{
            font-size: 12pt;
            font-weight: bold;
            text-align: left;
            margin-top: 14pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }}
        p {{
            margin-top: 0;
            margin-bottom: 10pt;
        }}
        ul, ol {{
            margin-bottom: 12pt;
        }}
        li {{
            margin-bottom: 4pt;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 12pt;
        }}
        th, td {{
            border: 1px solid #000;
            padding: 6px 10px;
        }}
        th {{
            font-weight: bold;
            text-align: center;
        }}
        img {{
            max-width: 100%;
            height: auto;
        }}
        .keep-together, .mermaid-container {{
            page-break-inside: avoid;
        }}
        .toc-container {{
            page-break-after: always;
        }}
        .toc-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        .toc-table th, .toc-table td {{
            border: 1px solid #000;
            padding: 6px 10px;
        }}
    </style>
</head>
<body>
{html}
</body>
</html>"""

        print(f"Starting WeasyPrint PDF generation for {job_id}...")

        # Use WeasyPrint to convert HTML to PDF (lightweight, no browser needed)
        from weasyprint import HTML
        
        html_doc = HTML(string=full_html)
        html_doc.write_pdf(output_path)

        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found")

        print(f"PDF generated successfully for {job_id}")

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="formatted_document.pdf"
        )
    except Exception as e:
        print(f"Critical Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
