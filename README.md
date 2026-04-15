# Flood Management Dashboard

An intelligent, AI-powered platform for real-time flood monitoring, prediction, disaster response, and recovery management using autonomous agents and machine learning.

---

## 🌍 Problem Statement

Floods are among the most devastating natural disasters, causing significant loss of life, property damage, and economic disruption worldwide. Traditional flood management systems face several challenges:

- **Delayed Response**: Manual monitoring and analysis lead to slow emergency response times
- **Incomplete Data**: Lack of real-time data integration from multiple sources
- **Poor Coordination**: Inefficient resource allocation during emergencies
- **Limited Prediction**: Weak early warning systems for flood forecasting
- **Recovery Management**: Difficult post-disaster recovery planning and resource optimization

Current systems lack intelligent automation, leading to preventable casualties and economic losses.

---

## 💡 Solution

The **Flood Management Dashboard** is an autonomous, AI-driven platform that addresses these challenges through:

- **Real-Time Monitoring**: Continuous satellite and sensor data integration for live flood tracking
- **ML-Based Prediction**: XGBoost and LSTM models for accurate flood forecasting
- **Autonomous Agents**: Intelligent agents for disaster prediction, monitoring, resource allocation, and recovery planning
- **Centralized Dashboard**: Unified interface for multi-stakeholder collaboration
- **Automated Alerts**: Real-time email and SMS notification system for early warning via Fast2SMS
- **Data-Driven Resource Allocation**: Optimal distribution of emergency resources based on risk analysis
- **Recovery Analytics**: Post-disaster recovery planning and progress tracking

---

## ✨ Features

### 🔍 Core Capabilities

1. **Real-Time Monitoring Agent**
   - Live flood status tracking
   - Multi-source data integration (satellite, weather stations, IoT sensors)
   - Interactive map visualization with geolocation data
   - System health monitoring and performance metrics

2. **Disaster Prediction Agent**
   - XGBoost and Random Forest ML models for flood risk prediction
   - LSTM neural networks for time-series forecasting
   - Multi-factor analysis (rainfall, water level, terrain, demography)
   - Risk level classification (Low, Medium, High, Critical)

3. **Resource Allocation Agent**
   - Intelligent distribution of emergency resources
   - Optimization algorithms for evacuation planning
   - Capacity management for shelters and aid centers
   - Cost-benefit analysis for resource deployment

4. **Recovery Agent**
   - Post-disaster impact assessment
   - Recovery progress tracking
   - Infrastructure damage evaluation
   - Community resilience planning

### 👥 User Management

- Multi-role authentication (Admin, Responder, Analyst, User)
- Secure login and signup with session management
- Role-based access control (RBAC)
- Admin dashboard for system management

### 📊 Analysis & Visualization

- Interactive charts and graphs (Chart.js)
- D3.js-based map visualization
- Real-time data updates via WebSocket
- Historical data analysis and trend reporting
- Custom report generation

### ⚙️ System Features

- RESTful API built with FastAPI
- Real-time bidirectional communication (Socket.IO)
- Persistent data storage (SQLAlchemy ORM)
- Email and push notifications
- System audit logging
- Responsive design (Tailwind CSS)

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.4.6 | React framework with SSR/SSG |
| **React** | 18.3.1 | UI component library |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Chart.js** | 4.4.1 | Data visualization |
| **D3.js** | 3.x | Advanced geospatial mapping |
| **Socket.IO Client** | 4.7.4 | WebSocket communication |
| **React Router** | 6.21.1 | Client-side routing |
| **Lucide React** | 0.539.0 | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.109.0 | Modern async web framework |
| **Uvicorn** | 0.27.0 | ASGI server |
| **SQLAlchemy** | 2.0.0 | ORM and query engine |
| **XGBoost** | 2.0.0 | Gradient boosting for prediction |
| **Scikit-Learn** | 1.4.0 | Classic ML algorithms |
| **Pandas** | 2.1.0 | Data manipulation |
| **NumPy** | 1.26.0 | Numerical computing |
| **Socket.IO** | 5.10.0 | Real-time communication |
| **Pillow** | 10.2.0 | Image processing |
| **Psutil** | 5.9.0 | System monitoring |
| **httpx** | 0.27.0 | Async HTTP client for SMS API calls |
| **Fast2SMS** | API | SMS gateway for emergency alerts (India) |

### Database & Deployment

- **SQLAlchemy**: ORM for database abstraction
- **Docker**: Containerization
- **Gunicorn** (optional): Production WSGI server
- **Heroku**: Cloud deployment (via Procfile)

---

## 📍 Workflow

### User Journey

```
1. User Registration & Authentication
   ↓
2. Role Assignment (Admin/Responder/Analyst)
   ↓
3. Dashboard Access (customized per role)
   ↓
4. Real-Time Data Monitoring
   ↓
5. Disaster Alerts & Predictions
   ↓
6. Resource Allocation Decisions
   ↓
7. Post-Disaster Recovery Management
```

### Data Flow

```
External Data Sources (Satellite, Weather APIs, Sensors)
   ↓
FastAPI Backend (Data Processing & Aggregation)
   ↓
Machine Learning Models (Prediction & Analysis)
   ↓
SQLAlchemy Database (Data Persistence)
   ↓
Socket.IO (Real-Time Updates)
   ↓
Next.js Frontend (Dashboard & Visualization)
```

### Autonomous Agent Workflow

```
Monitoring Agent → Detects Anomalies
   ↓
Prediction Agent → Forecasts Risk Levels
   ↓
Alert System → Notifies Stakeholders
   ↓
Resource Allocation Agent → Optimizes Deployment
   ↓
Recovery Agent → Tracks Post-Disaster Recovery
```

---

## 🚀 How to Run

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.8+
- **Git** for version control
- **Virtual environment** (recommended for Python)

### Installation & Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Flood-Management-dashboard
```

#### 2. Setup Backend (Python)

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.\.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Setup Frontend (Node.js)

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install
```

#### 4. Environment Configuration (Optional)

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

#### 5. Run the Backend

```powershell
# Make sure you're in the backend directory
cd backend

# Ensure virtual environment is activated
python backend.py

# Or use Uvicorn directly:
uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**
- API Documentation: **http://localhost:8000/docs**

#### 6. Run the Frontend (New Terminal)

```powershell
# Navigate to frontend directory
cd frontend

# Start development server with Turbopack
npm run dev

# Or build for production:
npm run build
npm start
```

Frontend will be available at: **http://localhost:3000**

#### 7. Access the Application

1. Open **http://localhost:3000** in your browser
2. Sign up for a new account or login
3. Select your role (Admin/Responder/Analyst)
4. Start monitoring flood data in real-time

### Docker Deployment (Optional)

```bash
# Navigate to backend directory
cd backend

# Build Docker image
docker build -t flood-dashboard .

# Run container
docker run -p 3000:3000 -p 8000:8000 flood-dashboard
```

### Production Deployment (Heroku)

The project includes a `Procfile` in the backend folder for Heroku deployment:

```bash
cd backend
git push heroku main
```

---

## 📧 Running Celery for Email Alerts

The ACMS platform uses **Celery** with **Redis** as the message broker to send alert emails asynchronously (e.g., on user signup, SOS trigger, damage report submissions).

### Prerequisites

- **Redis** must be installed and running locally.

#### Install Redis on Windows (via WSL or Memurai)

**Option A — WSL (recommended):**
```bash
# Inside WSL terminal
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
```

**Option B — Memurai (native Windows Redis alternative):**
Download from: https://www.memurai.com/

Verify Redis is running:
```bash
redis-cli ping
# Expected output: PONG
```

#### Install Redis on macOS
```bash
brew install redis
brew services start redis
```

---

### Environment Configuration

Make sure your `backend/.env` file has the correct values:

```env
# SMTP Settings (Gmail example)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password      # Use Gmail App Password (not your login password)
MAIL_FROM=your_email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME=ACMS Emergency Alerts

# Redis / Celery Broker
REDIS_URL=redis://localhost:6379/0

# Fast2SMS (SMS Alerts)
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

> **Gmail App Password**: Go to your Google Account → Security → 2-Step Verification → App Passwords → Create one for "Mail". Use that 16-character password, **not** your Gmail login password.

---

### Install Python Dependencies

```powershell
cd backend
pip install celery fastapi-mail redis
```

Or if you're using `requirements.txt`:
```powershell
pip install -r requirements.txt
```

---

### Start the Celery Worker

Open a **new terminal** (keep the FastAPI backend running in another terminal):

```powershell
# Navigate to backend directory
cd backend

# Activate your virtual environment (Windows)
.\.venv\Scripts\Activate.ps1

# Start Celery worker
celery -A backend.celery_worker worker --loglevel=info --pool=solo
```

> **Note**: On Windows, use `--pool=solo` because Celery's default `prefork` pool is not supported. On Linux/macOS, you can omit `--pool=solo`.

You should see output like:
```
[config]
.> app:          backend@hostname
.> transport:    redis://localhost:6379/0
.> results:      redis://localhost:6379/0
.> concurrency:  4 (solo)

[tasks]
  . send_email_alert_task

[2026-04-16 ...] celery@hostname ready.
```

---

### Running All Services Together

You need **4 terminals** running simultaneously for full functionality:

| Terminal | Command | Directory |
|----------|---------|-----------|
| 1 | `sudo service redis-server start` (WSL) | — |
| 2 | `python backend.py` | `backend/` |
| 3 | `celery -A backend.celery_worker worker --loglevel=info --pool=solo` | `backend/` |
| 4 | `npm run dev` | `frontend/` |

---

### Testing Email Alerts

To verify emails are working, register a new user on the platform. You should:
1. See the Celery worker terminal print the task being processed
2. Receive a welcome email at the registered email address

To manually trigger a test task from Python:
```python
from backend import send_email_alert_task
send_email_alert_task.delay(
    subject="ACMS Test Alert",
    recipients=["your_email@gmail.com"],
    body="This is a test email from the ACMS alert system."
)
```

---

### Troubleshooting

| Issue | Fix |
|-------|-----|
| `redis.exceptions.ConnectionError` | Redis is not running — start it first |
| `Authentication error` (SMTP) | Use a Gmail **App Password**, not your login password |
| `ModuleNotFoundError: celery` | Run `pip install celery fastapi-mail redis` |
| Celery exits immediately on Windows | Add `--pool=solo` to the worker command |
| Emails go to spam | Check SPF/DKIM settings or use a transactional email service in production |

---

## 📱 SMS Alerts via Fast2SMS

The ACMS platform uses **Fast2SMS** to send emergency flood alert SMS messages to all registered users when a high-risk event is detected.

### How It Works

When an admin clicks **Send SMS** in the Real-time Monitor dashboard, the backend collects all registered user phone numbers from the database, then makes an API call to Fast2SMS which delivers the emergency SMS to each user's mobile phone through Indian telecom networks.

### Setup

#### 1. Create a Free Account
- Go to [fast2sms.com](https://www.fast2sms.com) and sign up
- Navigate to **Dashboard → Dev API** and copy your API key

#### 2. Add Key to Environment

Open `backend/.env` and set:
```env
FAST2SMS_API_KEY=your_api_key_here
```

#### 3. Recharge Your Account
- Fast2SMS requires a minimum recharge of **₹100** to activate the bulk SMS route
- Each SMS costs approximately ₹0.25–₹0.50

#### 4. Restart the Backend
Run your backend app again to load the new `.env` variables.

### SMS Message Format

The system automatically composes region-specific messages based on risk level:

- **HIGH**: `[ACMS EMERGENCY] Flood Alert - Kerala Region. Risk Level: HIGH. Flood Probability: 80%. Evacuate immediately to the nearest shelter. Do not wait. Helpline: 1077. - Disaster Management Authority`
- **MODERATE**: `[ACMS WARNING] Flood Alert - Assam Region. Risk Level: MODERATE. Stay alert. Avoid low-lying areas and river banks. Helpline: 1077. - Disaster Management Authority`
- **LOW**: `[ACMS ADVISORY] Flood Alert - West Bengal Region. Risk Level: LOW. Monitor conditions. Follow official instructions. Helpline: 1077. - Disaster Management Authority`

### Testing Without Registered Users

Use the **Test number** field in the SMS Alerts card on the dashboard to send a test SMS to any specific phone number — no registered users required.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| `Fast2SMS API key not configured` | Add `FAST2SMS_API_KEY` to `backend/.env` and restart |
| `You need to complete 100 INR or more` | Recharge your Fast2SMS account with ₹100 minimum |
| `No valid 10-digit phone numbers found` | Register users with Indian mobile numbers, or use the Test number field |
| SMS not received | Ensure phone number is a valid 10-digit Indian number (DND numbers may be blocked) |



## 📁 Project Structure

```
Flood-Management-Dashboard/
├── frontend/                        # Next.js frontend application
│   ├── pages/                      # Next.js pages and React components
│   │   ├── index.js                # Landing page
│   │   ├── login.js                # User authentication
│   │   ├── signup.js               # User registration
│   │   ├── admin.js                # Admin panel
│   │   ├── adminDashboard.js       # Admin dashboard
│   │   ├── UserDashboard.js        # User dashboard
│   │   ├── monitoring-agent.js     # Real-time monitoring
│   │   ├── disaster-prediction-agent.js # Disaster prediction
│   │   ├── resource.js             # Resource allocation
│   │   ├── recovery.js             # Recovery management
│   │   └── Header.js               # Navigation header
│   ├── styles/                     # CSS stylesheets
│   │   └── globals.css             # Global styles
│   ├── utils/                      # Utility functions
│   │   └── config.js               # Configuration
│   ├── package.json                # Node.js dependencies
│   ├── package-lock.json           # Dependency lock file
│   └── next.config.js              # Next.js configuration
├── backend/                         # FastAPI backend server
│   ├── backend.py                  # FastAPI main application
│   ├── requirements.txt            # Python dependencies
│   ├── models/                     # ML models directory
│   │   ├── flood_model.pkl         # Trained flood prediction model
│   │   └── flood_scaler.pkl        # Feature scaler for preprocessing
│   ├── test_recovery_api.py        # API test suite
│   ├── acms.db                     # SQLite database
│   ├── Dockerfile                  # Docker configuration
│   └── Procfile                    # Heroku deployment
├── runtime.txt                      # Python runtime version
├── QUICK_REFERENCE.md              # Quick start guide
└── README.md                        # This file
```

---

## ⚙️ Challenges & Solutions

### 1. **Real-Time Data Processing**
   - **Challenge**: Handling large volumes of sensor data and updates simultaneously
   - **Solution**: Implemented WebSocket with Socket.IO for bi-directional communication and async FastAPI endpoints

### 2. **Model Accuracy & Prediction**
   - **Challenge**: Achieving high accuracy in flood prediction with limited historical data
   - **Solution**: Ensemble methods (XGBoost + Random Forest) and LSTM networks for temporal patterns; continuous model retraining

### 3. **System Scalability**
   - **Challenge**: Supporting concurrent users and high data throughput
   - **Solution**: Async architecture with FastAPI, connection pooling, caching, horizontal scaling via Docker

### 4. **Data Privacy & Security**
   - **Challenge**: Protecting sensitive user and operational data
   - **Solution**: Role-based access control, encrypted authentication, secure session management, audit logging

### 5. **Geographic Data Visualization**
   - **Challenge**: Rendering large geographic datasets efficiently
   - **Solution**: D3.js optimizations, map tiling, dynamic zoom levels, client-side filtering

### 6. **Cross-Platform Compatibility**
   - **Challenge**: Ensuring consistent experience across Windows, macOS, and Linux
   - **Solution**: Docker containerization, platform-agnostic Python/Node.js dependency management

### 7. **Agent Coordination**
   - **Challenge**: Autonomous agents making decisions without conflicts
   - **Solution**: Event-driven architecture with clear message passing and priority queuing

### 8. **Database Performance**
   - **Challenge**: Indexing and querying time-series data efficiently
   - **Solution**: SQLAlchemy with strategic indexing, time-partitioned tables, query optimization

## Screenshots

![Dashboard Overview](Flood%20images/page1.jpg)
*Dashboard Overview*

![Risk Analysis](Flood%20images/page2.jpg)
*Risk Analysis*

![Resource Management](Flood%20images/page3.jpg)
*Resource Management*

![Emergency Response](Flood%20images/page4.jpg)
*Emergency Response*

![Recovery Planning](Flood%20images/page5.jpg)
*Recovery Planning*
