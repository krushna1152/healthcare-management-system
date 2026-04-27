from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api.routes.auth import _get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


# ── SQLAlchemy models ────────────────────────────────────────────────────────

class InvoiceModel(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), nullable=False, unique=True)
    date_issue = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)


class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String(100), nullable=False, unique=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    invoice_number: str
    total_amount: Decimal
    date_issue: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    date_issue: datetime
    total_amount: Decimal

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    payment_id: str
    invoice_id: int
    amount_paid: Decimal
    payment_date: Optional[datetime] = None


class PaymentResponse(BaseModel):
    id: int
    payment_id: str
    invoice_id: int
    amount_paid: Decimal
    payment_date: datetime

    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/invoices/", response_model=List[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    _current_user: User = Depends(_get_current_user),
) -> list[InvoiceModel]:
    return db.query(InvoiceModel).order_by(InvoiceModel.date_issue.desc()).all()


@router.post("/invoices/", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(_get_current_user),
) -> InvoiceModel:
    existing = db.query(InvoiceModel).filter(InvoiceModel.invoice_number == payload.invoice_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice number already exists",
        )
    kwargs: dict = {"invoice_number": payload.invoice_number, "total_amount": payload.total_amount}
    if payload.date_issue:
        kwargs["date_issue"] = payload.date_issue
    invoice = InvoiceModel(**kwargs)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/payments/", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    _current_user: User = Depends(_get_current_user),
) -> list[PaymentModel]:
    return db.query(PaymentModel).order_by(PaymentModel.payment_date.desc()).all()


@router.post("/payments/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(_get_current_user),
) -> PaymentModel:
    invoice = db.query(InvoiceModel).filter(InvoiceModel.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    kwargs: dict = {
        "payment_id": payload.payment_id,
        "invoice_id": payload.invoice_id,
        "amount_paid": payload.amount_paid,
    }
    if payload.payment_date:
        kwargs["payment_date"] = payload.payment_date
    payment = PaymentModel(**kwargs)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
