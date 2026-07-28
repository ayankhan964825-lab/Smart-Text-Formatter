import os
import shutil
import uuid
import glob
import requests
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import zipfile
import json
from adobe.pdfservices.operation.auth.service_principal_credentials import ServicePrincipalCredentials
from adobe.pdfservices.operation.pdf_services import PDFServices
from adobe.pdfservices.operation.pdfjobs.params.extract_pdf.extract_pdf_params import ExtractPDFParams
from adobe.pdfservices.operation.pdfjobs.params.extract_pdf.extract_element_type import ExtractElementType
from adobe.pdfservices.operation.pdfjobs.jobs.extract_pdf_job import ExtractPDFJob
from adobe.pdfservices.operation.pdfjobs.result.extract_pdf_result import ExtractPDFResult
from adobe.pdfservices.operation.pdf_services_media_type import PDFServicesMediaType
app = FastAPI(title="Document Converter API (Render)")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = tempfile.gettempdir()
os.makedirs(TEMP_DIR, exist_ok=True)

# Comma-separated API keys from environment variable
# E.g. ILOVEPDF_KEYS="project_key_1,project_key_2,project_key_3"
ILOVEPDF_KEYS_ENV = os.environ.get("ILOVEPDF_KEYS", "")
API_KEYS = [k.strip() for k in ILOVEPDF_KEYS_ENV.split(",") if k.strip()]

# Unstructured API Keys
UNSTRUCTURED_KEYS_ENV = os.environ.get("UNSTRUCTURED_API_KEYS", "aqQankPtVSx8dPucOQ1wT2kGKntLb5,g0jUhQT9GRyWvhgRJnvv6RC4aKL8ce,ZGmvB4PWo9famWUrE20hfPcemhsPWl,mI1pTd41yY78l4oWRHQDowWYeKLbto")
UNSTRUCTURED_KEYS = [k.strip() for k in UNSTRUCTURED_KEYS_ENV.split(",") if k.strip()]
unstructured_key_index = 0

def get_next_unstructured_key():
    if not UNSTRUCTURED_KEYS:
        return None
    return UNSTRUCTURED_KEYS[unstructured_key_index]

# Adobe API Keys
ADOBE_KEYS = [
    {"client_id": "96cee6ec5643421fad1f6a15314d8f21", "client_secret": "p8e-CvkXaKdblhvEF_SGIO5tVamakMv3LWOT"},
    {"client_id": "31d94438d5db4c86a609f9de71d024c9", "client_secret": "p8e-vlouRizSwv8Ob8Fx0uFlRee3WQq7_xe-"},
    {"client_id": "bb9e8ad3ac6d4668a4ec6dc5c56f72dd", "client_secret": "p8e-8Cbqu7CAwl3S-NNPfyzkFUdzsKpcVccu"}
]
adobe_key_index = 0

def get_next_adobe_key():
    if not ADOBE_KEYS:
        return None
    return ADOBE_KEYS[adobe_key_index]

def rotate_adobe_key():
    global adobe_key_index
    if ADOBE_KEYS:
        adobe_key_index = (adobe_key_index + 1) % len(ADOBE_KEYS)
        print(f"Rotated to next Adobe key (Index: {adobe_key_index})")

def rotate_unstructured_key():
    global unstructured_key_index
    if UNSTRUCTURED_KEYS:
        unstructured_key_index = (unstructured_key_index + 1) % len(UNSTRUCTURED_KEYS)
        print(f"Rotated to next Unstructured key (Index: {unstructured_key_index})")

# Global state to keep track of which key to use
current_key_index = 0

ILOVEPDF_API_BASE = "https://api.ilovepdf.com/v1"

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


def ilovepdf_auth(public_key: str) -> str:
    """Get JWT token from iLovePDF using public key."""
    resp = requests.post(
        f"{ILOVEPDF_API_BASE}/auth",
        json={"public_key": public_key}
    )
    resp.raise_for_status()
    return resp.json()["token"]


def ilovepdf_start_task(token: str) -> dict:
    """Start a new officepdf task. Returns server and task id."""
    resp = requests.get(
        f"{ILOVEPDF_API_BASE}/start/officepdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    resp.raise_for_status()
    data = resp.json()
    return {"server": data["server"], "task": data["task"]}


def ilovepdf_upload(server: str, task: str, token: str, filepath: str, filename: str) -> str:
    """Upload a file to iLovePDF. Returns server_filename."""
    with open(filepath, "rb") as f:
        resp = requests.post(
            f"https://{server}/v1/upload",
            headers={"Authorization": f"Bearer {token}"},
            data={"task": task},
            files={"file": (filename, f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
    resp.raise_for_status()
    return resp.json()["server_filename"]


def ilovepdf_process(server: str, task: str, token: str, server_filename: str, original_filename: str) -> str:
    """Process the task. Returns download filename."""
    resp = requests.post(
        f"https://{server}/v1/process",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "task": task,
            "tool": "officepdf",
            "files": [
                {
                    "server_filename": server_filename,
                    "filename": original_filename
                }
            ]
        }
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("download_filename", "output.pdf")


def ilovepdf_download(server: str, task: str, token: str, output_path: str):
    """Download the processed file."""
    resp = requests.get(
        f"https://{server}/v1/download/{task}",
        headers={"Authorization": f"Bearer {token}"},
        stream=True
    )
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)


@app.post("/api/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    """
    Accepts a .docx file and converts it to a pixel-perfect PDF using iLovePDF REST API.
    Implements API key rotation to maximize monthly free tier usage.
    """
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    if not API_KEYS:
        raise HTTPException(status_code=500, detail="No iLovePDF keys configured on server")

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
            public_key = get_next_available_key()
            print(f"[{job_id}] Attempting iLovePDF conversion using key index {current_key_index}...")

            try:
                # Step 1: Authenticate
                print(f"[{job_id}] Authenticating...")
                token = ilovepdf_auth(public_key)
                print(f"[{job_id}] Auth OK")

                # Step 2: Start task
                print(f"[{job_id}] Starting task...")
                task_info = ilovepdf_start_task(token)
                server = task_info["server"]
                task_id = task_info["task"]
                print(f"[{job_id}] Task started on server: {server}")

                # Step 3: Upload file
                print(f"[{job_id}] Uploading file...")
                server_filename = ilovepdf_upload(server, task_id, token, input_path, f"{job_id}.docx")
                print(f"[{job_id}] Upload OK, server_filename: {server_filename}")

                # Step 4: Process
                print(f"[{job_id}] Processing...")
                download_filename = ilovepdf_process(server, task_id, token, server_filename, f"{job_id}.docx")
                print(f"[{job_id}] Process OK, download_filename: {download_filename}")

                # Step 5: Download
                print(f"[{job_id}] Downloading PDF...")
                ilovepdf_download(server, task_id, token, output_path)
                print(f"[{job_id}] Download OK, saved to: {output_path}")

                success = True
                break

            except requests.exceptions.HTTPError as http_err:
                status_code = http_err.response.status_code if http_err.response else 0
                error_text = http_err.response.text if http_err.response else str(http_err)
                print(f"[{job_id}] HTTP Error {status_code}: {error_text}")

                if status_code in [401, 402, 403, 429]:
                    print(f"[{job_id}] Quota/Auth issue. Rotating key...")
                    rotate_to_next_key()
                    attempts += 1
                else:
                    raise

            except Exception as api_err:
                print(f"[{job_id}] Unexpected error: {api_err}")
                rotate_to_next_key()
                attempts += 1

        if not success:
            raise Exception("All iLovePDF keys are depleted or failed.")

        if not os.path.exists(output_path):
            raise Exception("PDF generation failed, output file not found")

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="formatted_document.pdf"
        )
    except Exception as e:
        print(f"[{job_id}] Critical Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up DOCX file
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass

@app.post("/api/parse-unstructured")
def parse_unstructured(file: UploadFile = File(...)):
    """
    Parses a document (text, pdf, html) into JSON using Unstructured.io API.
    Implements key rotation.
    """
    if not UNSTRUCTURED_KEYS:
        raise HTTPException(status_code=500, detail="No Unstructured API keys configured on server")

    job_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".txt"
    input_path = os.path.join(TEMP_DIR, f"{job_id}{ext}")
    
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        attempts = 0
        max_attempts = len(UNSTRUCTURED_KEYS)
        
        while attempts < max_attempts:
            api_key = get_next_unstructured_key()
            print(f"[{job_id}] Attempting Unstructured parsing using key index {unstructured_key_index}...")
            
            url = 'https://api.unstructuredapp.io/general/v0/general'
            headers = {'unstructured-api-key': api_key, 'accept': 'application/json'}
            
            try:
                with open(input_path, 'rb') as f:
                    files = {'files': (file.filename, f, file.content_type)}
                    resp = requests.post(url, headers=headers, files=files)
                
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code in [401, 403, 429]:
                    print(f"[{job_id}] Unstructured Quota/Auth issue ({resp.status_code}). Rotating key...")
                    rotate_unstructured_key()
                    attempts += 1
                else:
                    print(f"[{job_id}] Unstructured API error: {resp.status_code} {resp.text}")
                    resp.raise_for_status()
                    
            except requests.exceptions.HTTPError as http_err:
                print(f"[{job_id}] Unstructured HTTP Error: {http_err}")
                if attempts >= max_attempts - 1:
                    raise
            except Exception as api_err:
                print(f"[{job_id}] Unexpected API error: {api_err}")
                rotate_unstructured_key()
                attempts += 1
                
        raise Exception("All Unstructured keys depleted or failed.")
    
    except Exception as e:
        print(f"[{job_id}] Critical Parsing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass

@app.post("/api/extract-style")
async def extract_style(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{job_id}_{file.filename}")
    
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attempts = 0
        max_attempts = len(ADOBE_KEYS)
        
        while attempts < max_attempts:
            adobe_creds = get_next_adobe_key()
            if not adobe_creds:
                raise HTTPException(status_code=500, detail="Adobe credentials missing in configuration")
                
            print(f"[{job_id}] Attempting Adobe extraction using key index {adobe_key_index}...")
            try:
                credentials = ServicePrincipalCredentials(
                    client_id=adobe_creds["client_id"],
                    client_secret=adobe_creds["client_secret"]
                )
                pdf_services = PDFServices(credentials=credentials)
                
                with open(input_path, 'rb') as f:
                    input_stream = f.read()
                    
                input_asset = pdf_services.upload(input_stream=input_stream, mime_type=PDFServicesMediaType.PDF.get_media_type())
                
                extract_pdf_params = ExtractPDFParams(
                    elements_to_extract=[ExtractElementType.TEXT]
                )
                extract_pdf_job = ExtractPDFJob(input_asset=input_asset, extract_pdf_params=extract_pdf_params)
                
                location = pdf_services.submit(extract_pdf_job)
                pdf_services_response = pdf_services.get_job_result(location, ExtractPDFResult)
                
                result_asset = pdf_services_response.get_result().get_resource()
                stream_asset = pdf_services.get_content(result_asset)
                
                zip_path = os.path.join(TEMP_DIR, f"{job_id}_result.zip")
                with open(zip_path, "wb") as f:
                    f.write(stream_asset.get_input_stream())
                
                # If we get here, extraction succeeded. Break out of retry loop.
                break
                
            except Exception as api_err:
                print(f"[{job_id}] Adobe API error with key index {adobe_key_index}: {api_err}")
                rotate_adobe_key()
                attempts += 1
                if attempts >= max_attempts:
                    raise Exception("All Adobe keys depleted or failed.")
            
        # Parse JSON
        with zipfile.ZipFile(zip_path, 'r') as z:
            with z.open('structuredData.json') as json_file:
                data = json.load(json_file)
                
        elements = data.get("elements", [])
        
        styles = []
        for el in elements:
            if "Text" in el and "Font" in el and "TextSize" in el:
                path = el.get("Path", "")
                font_name = el["Font"].get("name", "Default")
                font_size = el.get("TextSize", 12)
                
                if "H1" in path or "H2" in path or "H3" in path:
                    styles.append(f"Heading: {font_name} {font_size}pt")
                elif "P" in path:
                    styles.append(f"Body: {font_name} {font_size}pt")
                    
        unique_styles = list(set(styles))
        style_guide = "\n".join(unique_styles[:6])
        
        if not style_guide.strip():
            style_guide = "No specific styling found. Use standard formatting."
            
        return {"style_guide": style_guide}
        
    except Exception as e:
        print(f"[{job_id}] Adobe Extract Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path):
            try: os.remove(input_path)
            except: pass
        if 'zip_path' in locals() and os.path.exists(zip_path):
            try: os.remove(zip_path)
            except: pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
