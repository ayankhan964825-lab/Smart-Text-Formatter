import os
import shutil
import uuid
import glob
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
# E.g. ILOVEPDF_KEYS="project_key_1,project_key_2,project_key_3"
ILOVEPDF_KEYS_ENV = os.environ.get("ILOVEPDF_KEYS", "")
API_KEYS = [k.strip() for k in ILOVEPDF_KEYS_ENV.split(",") if k.strip()]

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
