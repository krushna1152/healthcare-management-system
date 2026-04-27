from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, appointments, billing, ai_detection

app = FastAPI(title="Healthcare Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(ai_detection.router, prefix="/ai", tags=["ai"])


@app.get("/")
def root() -> dict:
    return {"message": "Healthcare Management System API"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
