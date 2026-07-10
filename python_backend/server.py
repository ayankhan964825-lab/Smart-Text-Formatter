import os
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="Document Converter API (Render)")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
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
    using Playwright (Headless Chromium). This ensures the PDF output
    matches the browser preview and Word export exactly.
    """
    job_id = str(uuid.uuid4())
    html_path = os.path.join(TEMP_DIR, f"{job_id}.html")
    output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Build a full HTML document with proper styling for A4 PDF rendering
        full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
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
            page-break-inside: avoid;
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

        # Save HTML to file
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(full_html)

        print(f"Starting Playwright PDF generation for {job_id}...")

        # Use Playwright to convert HTML to PDF
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Load the HTML file
            page.goto(f"file://{html_path}", wait_until="networkidle")
            
            # Generate PDF with A4 size and 1-inch margins (matching Word export)
            page.pdf(
                path=output_path,
                format="A4",
                margin={
                    "top": "2.54cm",
                    "right": "2.54cm",
                    "bottom": "2.54cm",
                    "left": "2.54cm"
                },
                print_background=True
            )
            
            browser.close()

        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found after Playwright execution")

        print(f"PDF generated successfully for {job_id}")

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="formatted_document.pdf"
        )
    except Exception as e:
        print(f"Critical Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up HTML file (PDF file will be cleaned up after response)
        if os.path.exists(html_path):
            try:
                os.remove(html_path)
            except:
                pass

# Keep the old endpoint as fallback
@app.post("/api/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    job_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{job_id}.docx")
    output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Save the uploaded docx file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Convert to PDF using LibreOffice in headless mode
        print(f"Starting LibreOffice conversion for {job_id}...")
        
        command = [
            "libreoffice" if os.name != 'nt' else "soffice", 
            "--headless", 
            "--convert-to", "pdf", 
            input_path, 
            "--outdir", TEMP_DIR
        ]
        
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        print("Conversion Output:", result.stdout)
        if result.stderr:
            print("Conversion Error Log:", result.stderr)

        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found after LibreOffice execution")

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
    # In production (Render), port is usually assigned via PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
