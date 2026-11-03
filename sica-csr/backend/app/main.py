from fastapi import FastAPI
 
app = FastAPI(title="SICA-CSR")
 
 
@app.get("/health")
def health():
    return {"estado": "ok"}