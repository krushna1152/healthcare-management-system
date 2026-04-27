import random

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel

from app.api.routes.auth import _get_current_user
from app.models.user import User

router = APIRouter()

# Known skin disease classes (based on common dermatology datasets)
SKIN_CLASSES = [
    "Melanocytic nevi",
    "Melanoma",
    "Benign keratosis",
    "Basal cell carcinoma",
    "Actinic keratosis",
    "Vascular lesion",
    "Dermatofibroma",
]


class Prediction(BaseModel):
    label: str
    confidence: float


class DetectionResult(BaseModel):
    predicted_class: str
    confidence: float
    top_predictions: list[Prediction]


@router.post("/detect-skin-disease", response_model=DetectionResult)
async def detect_skin_disease(
    file: UploadFile = File(...),
    _current_user: User = Depends(_get_current_user),
) -> DetectionResult:
    """
    Accepts an image upload and returns skin-disease classification.

    NOTE: This endpoint currently returns a simulated result because the
    TensorFlow model weights are not bundled with the repository.
    Replace the body of this function with a real model.predict() call
    once the model file is available.
    """
    # Validate that the upload is an image
    if file.content_type and not file.content_type.startswith("image/"):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    # Consume the file bytes (needed when a real model is wired in)
    await file.read()

    # Simulated prediction — replace with real model inference
    random.shuffle(SKIN_CLASSES)
    scores = sorted(
        [random.uniform(0.05, 0.95) for _ in SKIN_CLASSES], reverse=True
    )
    # Normalise so they sum to 1
    total = sum(scores)
    scores = [round(s / total, 4) for s in scores]

    top_predictions = [
        Prediction(label=label, confidence=conf)
        for label, conf in zip(SKIN_CLASSES, scores)
    ]
    top_predictions.sort(key=lambda p: p.confidence, reverse=True)

    return DetectionResult(
        predicted_class=top_predictions[0].label,
        confidence=top_predictions[0].confidence,
        top_predictions=top_predictions[:5],
    )
