import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from docx2pdf import convert
import uuid

app = FastAPI(title="Document Converter API")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_conversions"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/api/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    # Generate unique filenames for this request
    job_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{job_id}.docx")
    output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Save the uploaded docx file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Convert to PDF
        convert(input_path, output_path)

        # Check if output exists
        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found")

        # Return the PDF file
        return FileResponse(
            output_path, 
            media_type="application/pdf", 
            filename="formatted_document.pdf"
        )
    except Exception as e:
        print(f"Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    # Note: For a real production app, we would use a background task to cleanup temp files
    # after the response is sent.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
