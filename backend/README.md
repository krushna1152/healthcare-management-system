# Backend – FastAPI Service

## Tech Stack

| Layer       | Library                    |
|-------------|----------------------------|
| Framework   | FastAPI 0.115               |
| Server      | Uvicorn                    |
| ORM         | SQLAlchemy 2.0             |
| DB Driver   | PyMySQL                    |
| Migrations  | Alembic                    |
| Auth        | python-jose (JWT) + passlib (bcrypt) |
| Validation  | Pydantic v2                |

## Module Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application & routers
│   ├── core/
│   │   ├── config.py        # Env-based settings (pydantic-settings)
│   │   └── security.py      # Password hashing & JWT helpers
│   ├── db/
│   │   ├── base.py          # SQLAlchemy declarative base
│   │   └── session.py       # Engine & session factory
│   ├── models/
│   │   └── user.py          # User ORM model
│   ├── schemas/
│   │   └── auth.py          # Pydantic request/response schemas
│   └── api/
│       └── routes/
│           ├── auth.py          # /auth/* endpoints
│           ├── appointments.py  # /appointments/* endpoints
│           ├── billing.py       # /billing/invoices and /billing/payments
│           └── ai_detection.py  # /ai/detect-skin-disease
├── alembic/                 # Alembic migration environment
│   └── versions/
│       ├── 0001_create_users_table.py
│       └── 0002_create_appointments_invoices_payments.py
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

## Running locally

```bash
# From repo root
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Environment variables

| Variable                        | Default      | Description               |
|---------------------------------|--------------|---------------------------|
| `MYSQL_HOST`                    | localhost    | MySQL host                |
| `MYSQL_PORT`                    | 3306         | MySQL port                |
| `MYSQL_USER`                    | root         | MySQL user                |
| `MYSQL_PASSWORD`                | password     | MySQL password            |
| `MYSQL_DB`                      | healthcare_db| Database name             |
| `JWT_SECRET_KEY`                | (required)   | Secret for signing JWTs   |
| `JWT_ALGORITHM`                 | HS256        | JWT algorithm             |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | 30         | Token lifetime in minutes |
