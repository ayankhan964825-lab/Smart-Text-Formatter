import os
import shutil
import uuid
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

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
# E.g. CONVERTAPI_KEYS="secret_1,secret_2,secret_3"
CONVERTAPI_KEYS_ENV = os.environ.get("CONVERTAPI_KEYS", "")
API_KEYS = [k.strip() for k in CONVERTAPI_KEYS_ENV.split(",") if k.strip()]

# Global state to keep track of which key to use
current_key_index = 0

@app.get("/ping")
async def ping():
    return {"status": "awake", "message": "Server is awake and ready!", "keys_configured": len(API_KEYS)}

def get_next_available_key():
    global current_key_index
    if not API_KEYS:
        return None
    key = API_KEYS[current_key_index]
    return key

def rotate_to_next_key():
    global current_key_index
    if API_KEYS:
        current_key_index = (current_key_index + 1) % len(API_KEYS)
        print(f"Rotated to next ConvertAPI key (Index: {current_key_index})")

@app.post("/api/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    """
    Accepts a .docx file and converts it to a pixel-perfect PDF using ConvertAPI.
    Implements API key rotation to maximize free tier usage.
    """
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    if not API_KEYS:
        raise HTTPException(status_code=500, detail="No ConvertAPI keys configured on server")

    job_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{job_id}.docx")
    output_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    try:
        # Save the uploaded docx file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Try conversion with key rotation
        attempts = 0
        max_attempts = len(API_KEYS)
        success = False

        while attempts < max_attempts:
            api_secret = get_next_available_key()
            print(f"Attempting conversion for {job_id} using key index {current_key_index}...")

            # ConvertAPI endpoint for DOCX to PDF
            url = f"https://v2.convertapi.com/convert/docx/to/pdf?Secret={api_secret}"

            with open(input_path, 'rb') as f:
                files = {'File': (file.filename, f)}
                response = requests.post(url, files=files)

            if response.status_code == 200:
                # Success!
                result_json = response.json()
                file_url = result_json['Files'][0]['Url']
                
                # Download the generated PDF
                pdf_response = requests.get(file_url)
                if pdf_response.status_code == 200:
                    with open(output_path, 'wb') as pdf_file:
                        pdf_file.write(pdf_response.content)
                    success = True
                    print(f"PDF generated successfully for {job_id}")
                    break
                else:
                    raise Exception("Failed to download PDF from ConvertAPI")
            
            elif response.status_code in [401, 402, 429]:
                # 401 Unauthorized, 402 Payment Required (out of credits), 429 Too Many Requests
                print(f"Key at index {current_key_index} failed/depleted (Status {response.status_code}). Rotating...")
                rotate_to_next_key()
                attempts += 1
            else:
                # Other unrecoverable errors (e.g. bad file format)
                error_msg = response.text
                print(f"ConvertAPI Error: {error_msg}")
                raise Exception(f"Conversion failed with status {response.status_code}: {error_msg}")

        if not success:
            raise Exception("All ConvertAPI keys are depleted or failed.")

        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found")

        return FileResponse(
            output_path, 
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
    # In production (Render), port is usually assigned via PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
