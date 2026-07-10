import os
import shutil
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pylovepdf.ilovepdf import ILovePdf

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

# Comma-separated API keys from environment variable
# E.g. ILOVEPDF_KEYS="project_key_1,project_key_2,project_key_3"
ILOVEPDF_KEYS_ENV = os.environ.get("ILOVEPDF_KEYS", "")
API_KEYS = [k.strip() for k in ILOVEPDF_KEYS_ENV.split(",") if k.strip()]

# Global state to keep track of which key to use
current_key_index = 0

@app.get("/ping")
async def ping():
    return {"status": "awake", "message": "Server is awake and ready!", "keys_configured": len(API_KEYS)}

def get_next_available_key():
    if not API_KEYS:
        return None
    return API_KEYS[current_key_index]

def rotate_to_next_key():
    global current_key_index
    if API_KEYS:
        current_key_index = (current_key_index + 1) % len(API_KEYS)
        print(f"Rotated to next iLovePDF key (Index: {current_key_index})")

@app.post("/api/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    """
    Accepts a .docx file and converts it to a pixel-perfect PDF using iLovePDF API.
    Implements API key rotation to maximize monthly free tier usage.
    """
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    if not API_KEYS:
        raise HTTPException(status_code=500, detail="No iLovePDF keys configured on server")

    job_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{job_id}.docx")
    
    # pylovepdf downloads the file with its original name but with a .pdf extension
    # So if we upload 'job_id.docx', it downloads 'job_id.pdf' into the output folder
    expected_output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Save the uploaded docx file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Try conversion with key rotation
        attempts = 0
        max_attempts = len(API_KEYS)
        success = False

        while attempts < max_attempts:
            public_key = get_next_available_key()
            print(f"Attempting iLovePDF conversion for {job_id} using key index {current_key_index}...")

            try:
                # Initialize iLovePDF
                ilovepdf = ILovePdf(public_key, verify_ssl=True)
                
                # Create a new office to pdf task
                task = ilovepdf.new_task('officepdf')
                
                # Add the DOCX file
                task.add_file(input_path)
                
                # Set output folder
                task.set_output_folder(TEMP_DIR)
                
                # Execute conversion
                task.execute()
                
                # Download the generated PDF
                task.download()
                
                # Clean up task on iLovePDF servers
                try:
                    task.delete_current_task()
                except:
                    pass

                success = True
                print(f"PDF generated successfully for {job_id}")
                break
                
            except Exception as api_err:
                error_str = str(api_err).lower()
                print(f"Key at index {current_key_index} failed. Error: {api_err}")
                
                # If error implies authentication or quota issue, rotate key
                if "401" in error_str or "unauthorized" in error_str or "quota" in error_str or "limit" in error_str:
                    print("Quota depleted or key invalid. Rotating...")
                    rotate_to_next_key()
                    attempts += 1
                else:
                    # Generic error, we still rotate just in case the key is locked
                    rotate_to_next_key()
                    attempts += 1

        if not success:
            raise Exception("All iLovePDF keys are depleted or failed.")

        if not os.path.exists(expected_output_path):
            raise Exception("PDF generation failed, output file not found in TEMP_DIR")

        return FileResponse(
            expected_output_path, 
            media_type="application/pdf", 
            filename="formatted_document.pdf"
        )
    except Exception as e:
        print(f"Critical Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up DOCX file
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
