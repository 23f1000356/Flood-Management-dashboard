# 🚀 Deployment Guide - Flood Management Dashboard

This guide covers deploying both the **Next.js frontend** and **FastAPI backend**.

---

## 📋 Prerequisites

- Node.js v18+
- Python 3.10+
- Git
- GitHub account (for deployment platforms)

---

## 🖥️ Local Development

### 1. Frontend (Next.js)

```powershell
# Navigate to project
cd "c:\Users\royvi\Downloads\Flood-Management-dashboard-main\Flood-Management-dashboard-main"

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 2. Backend (FastAPI)

```powershell
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
python backend.py
```

Backend runs at: `http://localhost:8000`

---

## ☁️ Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repository
4. Vercel auto-detects Next.js settings
5. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   ```
6. Click Deploy

#### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a `Procfile` in your project root:
   ```
   web: uvicorn backend:app --host 0.0.0.0 --port $PORT
   ```
5. Railway auto-detects Python and installs from `requirements.txt`
6. Add environment variables if needed

---

### Option 2: Render (Both Frontend & Backend)

#### Backend on Render

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend:app --host 0.0.0.0 --port $PORT`
5. Deploy

#### Frontend on Render

1. Create new "Static Site"
2. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `out` (for static export) or `.next` 
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

---

### Option 3: Docker Deployment

Create a `Dockerfile` for the backend:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t flood-backend .
docker run -p 8000:8000 flood-backend
```

---

## 🔧 Configuration Files

### Procfile (for Heroku/Railway)
```
web: uvicorn backend:app --host 0.0.0.0 --port $PORT
```

### runtime.txt (Python version)
```
python-3.11.7
```

---

## 🔗 Connecting Frontend to Backend

Update API calls in your Next.js pages to use an environment variable:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Example API call
const response = await fetch(`${API_URL}/api/predict-flood`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

---

## ⚠️ Important Notes

1. **Database**: The project uses SQLite (`acms.db`) which is file-based. For production, consider migrating to PostgreSQL.

2. **ML Models**: The models are trained on startup. For production, pre-train and save models to reduce startup time.

3. **CORS**: Update `backend.py` to allow your production frontend URL:
   ```python
   allow_origins=[
       "http://localhost:3000",
       "https://your-frontend.vercel.app",
   ]
   ```

4. **Environment Variables**: Never commit secrets. Use `.env` files locally and platform secrets in production.

---

## 📊 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create `requirements.txt` ✅
- [ ] Create `Procfile` for backend
- [ ] Update CORS settings for production URLs
- [ ] Set up environment variables
- [ ] Deploy backend first, get URL
- [ ] Deploy frontend with backend URL
- [ ] Test all API endpoints
- [ ] Verify WebSocket connections

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Run `pip install -r requirements.txt` |
| CORS errors | Add frontend URL to `allow_origins` in backend |
| Port already in use | Kill process or use different port |
| TensorFlow memory errors | Use CPU-only version or increase memory |

---

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
