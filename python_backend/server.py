import os
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
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
        # The command: soffice --headless --convert-to pdf input.docx --outdir /tmp/conversions
        print(f"Starting LibreOffice conversion for {job_id}...")
        
        # Use soffice (Linux) or soffice.exe (Windows, if installed locally for some reason)
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
