import os
from pylovepdf.tools.officepdf import OfficeToPdf

public_key = "project_public_f6743dce17bc37cb1faaa86c18292c63_lWL4d695d3d5cb983a0b9c7f6e8acf3fece73"

def test_ilovepdf():
    try:
        dummy_docx = "test_document_123.docx"
        with open(dummy_docx, "wb") as f:
            f.write(b"PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00") 
            
        print("Authenticating & creating task...")
        task = OfficeToPdf(public_key=public_key, verify_ssl=True, proxies=None)
        
        print("Adding file...")
        task.add_file(dummy_docx)
        
        print("Setting output folder...")
        task.set_output_folder(".")
        
        print("Executing...")
        task.execute()
        
        print("Downloading...")
        task.download()
        
        print("Task complete. Files in dir:", os.listdir("."))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ilovepdf()
