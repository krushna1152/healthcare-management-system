# Healthcare Management System

A full-stack healthcare management platform with AI-powered features.

## Monorepo Structure

```
healthcare-management-system/
├── backend/          # FastAPI Python backend
├── web/              # React web application (Step 2)
├── mobile/           # Flutter mobile app (Step 3)
├── docs/             # Project documentation
└── README.md
```

---

## Step 1 Setup: FastAPI Backend + MySQL

### Prerequisites

- Python 3.11+
- MySQL 8.0+
- Git

---

### 1. Create & activate virtual environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your MySQL credentials and a strong JWT_SECRET_KEY
```

### 4. Create MySQL database

```sql
CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Alembic migrations

```bash
# From backend/
alembic upgrade head
```

### 6. Start the development server

```bash
# From backend/
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 7. Test the endpoints

**Health check:**
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

**Register a new user:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123","role":"patient"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
# Returns: {"access_token":"<JWT>","token_type":"bearer"}
```

**Get current user (replace TOKEN):**
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Step 2 Setup: React Web Frontend

### Prerequisites

- Node.js 18+
- npm 9+

---

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Start the development server

```bash
# From web/
npm run dev
```

The web app will be available at `http://localhost:5173`.  
It proxies all `/api/*` requests to the FastAPI backend at `http://localhost:8000`.

> **Note:** Make sure the FastAPI backend is running before you open the app.

### 3. Pages

| Route | Description |
|---|---|
| `/login` | Sign in with email & password |
| `/register` | Create a new patient or doctor account |
| `/dashboard` | Overview of appointments, invoices, and AI scans |
| `/appointments` | Book and manage appointments |
| `/billing` | View invoices and payment history |
| `/ai-detection` | Upload a skin image for AI-powered disease classification |

---


## Contributing

See [backend/README.md](backend/README.md) for backend-specific development instructions.
