from fastapi import FastAPI
from app.api.routes import auth

app = FastAPI(title="Healthcare Management System", version="1.0.0")

app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/")
def root() -> dict:
    return {"message": "Healthcare Management System API"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
