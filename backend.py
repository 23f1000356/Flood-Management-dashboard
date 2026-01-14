from fastapi import FastAPI, HTTPException, Depends, UploadFile, File# --- Realtime notifications helper (stub) ---
# If you later wire WebSocket/SSE broadcasting, implement it here. For now we log safely.
async def notify_alert(message: str, level: str = "info"):
    try:
        # Use existing logger if available
        try:
            logger.info(f"[notify_alert] {level.upper()}: {message}")
        except NameError:
            print(f"[notify_alert] {level.upper()}: {message}")
    except Exception as e:
        # Never fail the API due to notifier issues
        try:
            logger.error(f"notify_alert failed: {e}")
        except Exception:
            print(f"notify_alert failed: {e}")

from fastapi.responses import JSONResponse
from pydantic import BaseModel, confloat, Field
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import socketio
import os
from pydantic import BaseModel
import pandas as pd
import io
from PIL import Image
import psutil
import platform
import time
import random
import uvicorn
import logging
import json
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
import joblib  # For model persistence
from typing import Optional, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI and SocketIO setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(async_mode='asgi')
app.mount("/ws", socketio.ASGIApp(sio))

# Database setup
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'acms.db')
engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class ResourceAllocation(Base):
    __tablename__ = 'resource_allocations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    disaster_id = Column(Integer, ForeignKey('disasters.disaster_id'), nullable=False)
    resource_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    allocated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    disaster = relationship("Disaster", backref="resource_allocations")

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    emergency_contact = Column(String, nullable=True)
    address = Column(String, nullable=True)
    medical_conditions = Column(String, nullable=True)

class Agent(Base):
    __tablename__ = 'agents'
    agent_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    accuracy = Column(Float, nullable=True)
    uptime = Column(Float, nullable=True)
    load = Column(Float, nullable=True)
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow)

class Disaster(Base):
    __tablename__ = 'disasters'
    disaster_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    prediction_accuracy = Column(Float, nullable=True)
    last_updated = Column(DateTime, nullable=True)
    recovery_cost = Column(Float, nullable=True)
    displaced_people = Column(Integer, nullable=True)
    required_resources = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = 'alerts'
    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    disaster_id = Column(Integer, ForeignKey('disasters.disaster_id'), nullable=True)
    type = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(String(255), nullable=False)
    time = Column(DateTime, nullable=False, default=datetime.utcnow)
    acknowledged = Column(Boolean, default=False)
    disaster = relationship("Disaster", backref="alerts")

class CarbonFootprint(Base):
    __tablename__ = 'carbon_footprint'
    footprint_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    electricity_kwh = Column(Float, nullable=False)
    car_miles = Column(Float, nullable=False)
    flights_miles = Column(Float, nullable=False)
    recycling = Column(Boolean, nullable=False)
    carbon_value = Column(Float, nullable=False)
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    user = relationship("User", backref="carbon_footprints")

class WildfireData(Base):
    __tablename__ = 'wildfire_data'
    id = Column(Integer, primary_key=True, autoincrement=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    ndvi = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    risk_probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    predicted_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class Issue(Base):
    __tablename__ = 'issues'
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default='open')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class FloodPrediction(Base):
    __tablename__ = 'flood_predictions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    mar_may_rainfall = Column(Float, nullable=False)
    june_10days_rainfall = Column(Float, nullable=False)
    may_june_increase = Column(Float, nullable=False)
    flood_probability = Column(Float, nullable=False)
    flood_prediction = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    predicted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    estimated_water_level = Column(Float, nullable=True)
    current_river_level = Column(Float, nullable=True)

class DamageAssessment(Base):
    __tablename__ = 'damage_assessments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    disaster_id = Column(Integer, ForeignKey('disasters.disaster_id'), nullable=False)
    damaged_area_percentage = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    assessed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    disaster = relationship("Disaster", backref="damage_assessments")

class Inventory(Base):
    __tablename__ = 'inventory'
    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_name = Column(String(100), nullable=False, unique=True)
    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(50), nullable=True)
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow)

class ResourceRequest(Base):
    __tablename__ = 'resource_requests'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    resource_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default='pending')  # pending, approved, rejected
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    notes = Column(String(500), nullable=True)
    user = relationship("User", backref="resource_requests")

class CommunityReport(Base):
    __tablename__ = 'community_reports'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    report_type = Column(String(100), nullable=False)
    description = Column(String(1000), nullable=False)
    location = Column(String(200), nullable=True)
    status = Column(String(50), nullable=False, default='open')  # open, investigating, resolved
    reported_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    user = relationship("User", backref="community_reports")

class Shelter(Base):
    __tablename__ = 'shelters'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    capacity = Column(Integer, nullable=False)
    assigned_region = Column(String(200), nullable=False)
    beds_available = Column(Integer, nullable=True)
    has_food = Column(Boolean, default=True)
    has_medical = Column(Boolean, default=True)
    distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class Donation(Base):
    __tablename__ = 'donations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    amount = Column(Float, nullable=False)
    donor_name = Column(String(200), nullable=True)
    donor_email = Column(String(200), nullable=True)
    status = Column(String(50), nullable=False, default='pending')  # pending, accepted, rejected
    donated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    user = relationship("User", backref="donations")

class ItemPickup(Base):
    __tablename__ = 'item_pickups'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    items = Column(String(500), nullable=False)  # Comma-separated list
    pickup_address = Column(String(500), nullable=False)
    contact_number = Column(String(20), nullable=True)
    status = Column(String(50), nullable=False, default='pending')  # pending, scheduled, rejected
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    user = relationship("User", backref="item_pickups")

class VolunteerRequest(Base):
    __tablename__ = 'volunteer_requests'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    volunteer_name = Column(String(200), nullable=False)
    volunteer_email = Column(String(200), nullable=True)
    volunteer_phone = Column(String(20), nullable=True)
    areas_of_interest = Column(String(500), nullable=True)
    duration_months = Column(Integer, nullable=True)  # Duration in months
    status = Column(String(50), nullable=False, default='pending')  # pending, accepted, rejected
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    user = relationship("User", backref="volunteer_requests")

class DamageReport(Base):
    __tablename__ = 'damage_reports'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    property_type = Column(String(100), nullable=False)
    damage_level = Column(String(100), nullable=False)
    estimated_loss = Column(Float, nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(50), nullable=False, default='pending')  # pending, approved, rejected
    submitted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    user = relationship("User", backref="damage_reports")

class FinancialAid(Base):
    __tablename__ = 'financial_aid'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    aid_type = Column(String(100), nullable=False)  # Government Relief, Insurance Claim, Business Loan
    amount_requested = Column(Float, nullable=False)
    purpose = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default='pending')  # pending, approved, rejected
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    approved_amount = Column(Float, nullable=True)
    user = relationship("User", backref="financial_aid")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models
class SignupData(BaseModel):
    name: str
    username: str
    phone: str
    email: str
    password: str
    gender: str
    role: str = "user"

class LoginData(BaseModel):
    username: str
    password: str
    role: str = "user"

class FootprintData(BaseModel):
    user_id: int
    electricity_kwh: float
    car_miles: float
    flights_miles: float
    recycling: bool

class WildfireInput(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    ndvi: float
    soil_moisture: float

class WildfireBatchInput(BaseModel):
    data: list[WildfireInput]

class FloodPredictionInput(BaseModel):
    mar_may_rainfall: float = Field(ge=0, le=1000)
    june_10days_rainfall: float = Field(ge=0, le=500)
    may_june_increase: float = Field(ge=0, le=1000)
    region: str

class FloodBatchInput(BaseModel):
    predictions: list[FloodPredictionInput]

class FloodInput(BaseModel):
    name: str
    region: str
    severity: str
    status: str
    prediction_accuracy: float | None = None

class IssueInput(BaseModel):
    title: str
    description: str
    status: str | None = None

class ImpactInput(BaseModel):
    disaster_id: Optional[int] = None
    flood_probability: float
    severity: str
    population_density: float

class ImageAssessmentInput(BaseModel):
    disaster_id: int

class ResourceAllocationInput(BaseModel):
    region: str
    resource_type: str
    quantity: int

class AidRequestInput(BaseModel):
    region: str

class TeamDispatchInput(BaseModel):
    region: str

# Global variables for models
MODEL_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
FLOOD_MODEL_PATH = os.path.join(MODEL_DIR, 'flood_model.pkl')
FLOOD_SCALER_PATH = os.path.join(MODEL_DIR, 'flood_scaler.pkl')
flood_model = None
flood_scaler = None
recovery_model = None
cnn_model = None

# Region population densities (approximate values in people per sq km)
region_density = {
    'Kerala': 859,
    'Assam': 398,
    'West Bengal': 1028,
    'Uttar Pradesh': 828
}

# Valid regions for validation
VALID_REGIONS = ['Kerala', 'Assam', 'West Bengal', 'Uttar Pradesh']

# Initialize Database and Load or Train Models
Base.metadata.create_all(bind=engine)

def load_or_train_flood_model():
    global flood_model, flood_scaler
    try:
        if os.path.exists(FLOOD_MODEL_PATH) and os.path.exists(FLOOD_SCALER_PATH):
            flood_model = joblib.load(FLOOD_MODEL_PATH)
            flood_scaler = joblib.load(FLOOD_SCALER_PATH)
            logger.info("Loaded existing flood model and scaler")
        else:
            logger.info("Training new flood model...")
            historical_data = np.array([
                [386.2, 274.9, 649.9, 0], [275.7, 130.3, 256.4, 1], [336.3, 186.2, 308.9, 0],
                [862.5, 366.1, 394.4, 1], [378.5, 283.4, 586.9, 0], [230.0, 138.3, 254.1, 0],
                [669.5, 256.9, 328.0, 1], [283.7, 197.5, 450.0, 0], [628.3, 234.9, 231.5, 1],
                [296.7, 226.7, 531.2, 0], [809.4, 330.0, 249.7, 1], [730.9, 316.1, 351.1, 1],
                [295.2, 180.6, 342.9, 0], [215.0, 188.4, 401.1, 0], [541.6, 232.0, 303.1, 1],
                [900.0, 450.0, 950.0, 1], [850.0, 400.0, 900.0, 1], [800.0, 350.0, 850.0, 1],
                [700.0, 300.0, 800.0, 1], [600.0, 250.0, 750.0, 0], [500.0, 200.0, 700.0, 0],
            ])
            X = historical_data[:, :3]
            y = historical_data[:, 3]
            flood_scaler = StandardScaler()
            X_scaled = flood_scaler.fit_transform(X)
            flood_model = xgb.XGBClassifier(
                objective='binary:logistic', random_state=42, n_estimators=100, learning_rate=0.1,
                max_depth=5, subsample=0.8, colsample_bytree=0.8, gamma=0.1
            )
            flood_model.fit(X_scaled, y)
            joblib.dump(flood_model, FLOOD_MODEL_PATH)
            joblib.dump(flood_scaler, FLOOD_SCALER_PATH)
            logger.info(f"XGBoost flood model trained with accuracy: {flood_model.score(X_scaled, y):.3f}")
    except Exception as e:
        logger.error(f"Error loading or training flood model: {str(e)}")
        raise

def train_recovery_model():
    global recovery_model
    try:
        historical_data = np.array([
            [0.9, 3, 859, 10000, 500000, 3000], [0.6, 2, 398, 5000, 300000, 1500],
            [0.3, 1, 1028, 1000, 100000, 600], [0.8, 3, 828, 8000, 450000, 2500],
            [0.4, 2, 859, 3000, 200000, 900], [0.7, 3, 398, 7000, 400000, 2200],
            [0.5, 2, 1028, 4000, 250000, 1200], [0.2, 1, 828, 500, 50000, 300],
            [0.85, 3, 859, 9000, 480000, 2800], [0.45, 2, 398, 3500, 220000, 1000],
        ])
        X = historical_data[:, :3]
        y = historical_data[:, 3:]
        recovery_model = RandomForestRegressor(n_estimators=100, random_state=42)
        recovery_model.fit(X, y)
        logger.info(f"Random Forest recovery model trained with accuracy: {recovery_model.score(X, y):.3f}")
    except Exception as e:
        logger.error(f"Error training recovery model: {str(e)}")
        raise

def train_cnn_model():
    global cnn_model
    try:
        cnn_model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            MaxPooling2D((2, 2)), Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D((2, 2)), Flatten(), Dense(128, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        cnn_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        logger.info("CNN model initialized and 'trained' with dummy data")
    except Exception as e:
        logger.error(f"Error training CNN model: {str(e)}")
        raise

# Startup event to ensure models are loaded
@app.on_event("startup")
def startup_event():
    global flood_model, flood_scaler, recovery_model, cnn_model
    logger.info("Starting up and loading models...")
    load_or_train_flood_model()
    train_recovery_model()
    train_cnn_model()

# Initialize Database and Models
def init_db():
    db = SessionLocal()
    try:
        # Drop all tables and recreate to ensure a clean state
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        admin_username = "admin"
        admin_password = "admin123"
        # Check and update or create admin user with plain text password
        admin_user = db.query(User).filter_by(username=admin_username).first()
        if not admin_user:
            admin_user = User(
                name="Administrator",
                username=admin_username,
                phone="0000000000",
                email="admin@example.com",
                password=admin_password,
                gender="Not Specified",
                role="admin"
            )
            db.add(admin_user)
            logger.info("Created default admin user 'admin' with password 'admin123'")
        else:
            # Update existing admin user with plain text password and ensure role is admin
            admin_user.password = admin_password
            admin_user.role = "admin"  # Ensure role is set to admin
            logger.info("Ensured default admin user exists; password and role updated if necessary")

        # Ensure admin is persisted immediately so early login works
        db.commit()

        seed_regions = ['Kerala', 'Assam', 'West Bengal', 'Uttar Pradesh']
        seed_risks = ['high', 'moderate', 'low', 'high']
        for i, region in enumerate(seed_regions):
            risk_level = seed_risks[i]
            flood_probability = 0.8 if risk_level == 'high' else 0.5 if risk_level == 'moderate' else 0.2
            confidence = 0.85 + random.uniform(-0.05, 0.05)
            prediction = FloodPrediction(
                mar_may_rainfall=300 + random.uniform(-50, 50),
                june_10days_rainfall=200 + random.uniform(-50, 50),
                may_june_increase=500 + random.uniform(-100, 100),
                flood_probability=flood_probability,
                flood_prediction=1 if flood_probability > 0.5 else 0,
                confidence=confidence,
                region=region,
                estimated_water_level=flood_probability * 3,
                current_river_level=5 + flood_probability * 2
            )
            db.add(prediction)
            impact_data = ImpactInput(flood_probability=flood_probability, severity=risk_level, population_density=region_density[region])
            impact = predict_impact(impact_data)
            disaster = Disaster(
                name=f"{region} Flood",
                type='flood',
                location=region,
                severity=risk_level,
                status='active' if risk_level == 'high' else 'monitored',
                prediction_accuracy=confidence * 100,
                last_updated=datetime.utcnow(),
                recovery_cost=impact["recovery_cost"],
                displaced_people=impact["displaced_people"],
                required_resources=json.dumps({'food': impact["required_resources"], 'water': impact["required_resources"] + 300})
            )
            db.add(disaster)
            db.commit()
            db.refresh(disaster)
            damaged_area_percentage = flood_probability * 50
            damaged_area_percentage = max(0, min(100, damaged_area_percentage))
            assessment = DamageAssessment(
                disaster_id=disaster.disaster_id,
                damaged_area_percentage=damaged_area_percentage,
                confidence=confidence
            )
            db.add(assessment)
        db.commit()
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        db.rollback()
    finally:
        db.close()

init_db()

# SocketIO notification function
async def notify_alert(message: str, alert_type: str = 'warning'):
    await sio.emit('alert', {'message': message, 'type': alert_type})

# SocketIO events
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

# Function to get dashboard data
async def get_dashboard_data(db: Session):
    try:
        logger.info("Fetching active and monitored flood disasters")
        disasters = db.query(Disaster).filter(Disaster.type=='flood', Disaster.status.in_(['active', 'monitored'])).all()
        logger.info(f"Found {len(disasters)} disasters")
        dashboard_data = []
        for d in disasters:
            logger.info(f"Processing disaster {d.disaster_id} at {d.location}")
            latest_prediction = db.query(FloodPrediction).filter_by(region=d.location).order_by(FloodPrediction.predicted_at.desc()).first()
            flood_probability = latest_prediction.flood_probability if latest_prediction else 0.5
            population_density = region_density.get(d.location, 500)
            impact_data = ImpactInput(flood_probability=flood_probability, severity=d.severity, population_density=population_density)
            impact_response = predict_impact(impact_data)
            damage_assessment = db.query(DamageAssessment).filter_by(disaster_id=d.disaster_id).order_by(DamageAssessment.assessed_at.desc()).first()
            damaged_area_percentage = damage_assessment.damaged_area_percentage if damage_assessment else round(flood_probability * 50, 2)
            recovery_strategy = "Monitor situation" if d.severity == "low" else "Prepare resources" if d.severity == "moderate" else "Activate relief operations"
            allocated_resources = {r.resource_type: r.quantity for r in d.resource_allocations}
            dashboard_data.append({
                "disaster_id": d.disaster_id,
                "location": d.location,
                "severity": d.severity,
                "recovery_cost": impact_response["recovery_cost"],
                "displaced_people": impact_response["displaced_people"],
                "required_resources": impact_response["required_resources"],
                "damaged_area_percentage": damaged_area_percentage,
                "recovery_strategy": recovery_strategy,
                "last_updated": d.last_updated.isoformat() if d.last_updated else None,
                "allocated_resources": allocated_resources,
            })
        logger.info(f"Returning {len(dashboard_data)} dashboard entries")
        return dashboard_data
    except Exception as e:
        logger.error(f"Error in get_dashboard_data: {str(e)}")
        raise

# Resource Allocation Endpoint
@app.post("/api/allocate-resources")
async def allocate_resources(data: ResourceAllocationInput, db: Session = Depends(get_db)):
    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
    valid_resources = ['food', 'water', 'medical', 'shelter', 'boats', 'helicopters', 'sandbags', 'pumps', 'buses']
    if data.resource_type not in valid_resources:
        raise HTTPException(status_code=400, detail=f"Invalid resource type. Valid types are: {', '.join(valid_resources)}")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    disaster = db.query(Disaster).filter_by(location=data.region, type='flood').first()
    if not disaster:
        disaster = Disaster(
            name=f"{data.region} Flood",
            type='flood',
            location=data.region,
            severity='low',
            status='monitored',
            prediction_accuracy=0.85 * 100,
            last_updated=datetime.utcnow()
        )
        db.add(disaster)
        db.commit()
        db.refresh(disaster)

    allocation = ResourceAllocation(
        disaster_id=disaster.disaster_id,
        resource_type=data.resource_type,
        quantity=data.quantity
    )
    db.add(allocation)
    db.commit()
    await sio.emit('resource-update', {
        'region': data.region,
        'message': f'Allocated {data.quantity} {data.resource_type}',
        'resources': {data.resource_type: data.quantity}
    })
    return JSONResponse({"message": f"Allocated {data.quantity} {data.resource_type} to {data.region}"})

# Aid Request Endpoint
@app.post("/api/request-aid")
async def request_aid(data: AidRequestInput, db: Session = Depends(get_db)):
    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
    
    disaster = db.query(Disaster).filter_by(location=data.region, type='flood').first()
    if not disaster:
        disaster = Disaster(
            name=f"{data.region} Flood",
            type='flood',
            location=data.region,
            severity='low',
            status='monitored',
            prediction_accuracy=0.85 * 100,
            last_updated=datetime.utcnow()
        )
        db.add(disaster)
        db.commit()
        db.refresh(disaster)

    # Simulate aid allocation (e.g., food, water, medical supplies)
    base_aid = {'food': 100, 'water': 200, 'medical': 50}
    for resource, qty in base_aid.items():
        allocation = ResourceAllocation(
            disaster_id=disaster.disaster_id,
            resource_type=resource,
            quantity=qty
        )
        db.add(allocation)
    db.commit()
    
    await notify_alert(f"Aid requested for {data.region}. Dispatching emergency supplies.", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": f"Aid request processed for {data.region}"})

# Team Dispatch Endpoint
@app.post("/api/dispatch-team")
async def dispatch_team(data: TeamDispatchInput, db: Session = Depends(get_db)):
    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
    
    disaster = db.query(Disaster).filter_by(location=data.region, type='flood').first()
    if not disaster:
        disaster = Disaster(
            name=f"{data.region} Flood",
            type='flood',
            location=data.region,
            severity='low',
            status='monitored',
            prediction_accuracy=0.85 * 100,
            last_updated=datetime.utcnow()
        )
        db.add(disaster)
        db.commit()
        db.refresh(disaster)

    # Update disaster status based on severity
    if disaster.severity in ['moderate', 'high']:
        disaster.status = 'active'
    db.commit()
    
    await notify_alert(f"Rescue team dispatched to {data.region}.", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": f"Team dispatched to {data.region}"})

# Flood Prediction Endpoint
@app.post("/api/predict-flood")
async def predict_flood(data: FloodPredictionInput, db: Session = Depends(get_db)):
    global flood_model, flood_scaler
    if flood_model is None or flood_scaler is None:
        load_or_train_flood_model()  # Reload if None
        if flood_model is None or flood_scaler is None:
            logger.error("Flood prediction model not initialized")
            raise HTTPException(status_code=500, detail="Flood prediction model not initialized")

    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")

    try:
        input_data = np.array([[data.mar_may_rainfall, data.june_10days_rainfall, data.may_june_increase]])
        input_scaled = flood_scaler.transform(input_data)
        
        flood_prediction = flood_model.predict(input_scaled)[0]
        probabilities = flood_model.predict_proba(input_scaled)[0]
        flood_probability = float(probabilities[1])
        confidence = float(max(probabilities))
        
        region_multiplier = {'Kerala': 1.2, 'Assam': 1.5, 'West Bengal': 1.4, 'Uttar Pradesh': 1.1}.get(data.region, 1.0)
        flood_probability = min(flood_probability * region_multiplier, 1.0)
        
        estimated_water_level = round(flood_probability * 3 + random.uniform(0, 1), 2)
        current_river_level = round(5 + flood_probability * 2 + random.uniform(-0.5, 0.5), 2)
        evacuation_recommendation = "Yes" if flood_probability > 0.5 else "No"
        affected_population_estimate = int(100000 * flood_probability + random.randint(0, 10000))
        
        if confidence < 0.5:
            logger.warning(f"Low confidence prediction for region {data.region}: {confidence}")
            new_issue = Issue(title="Low Confidence Prediction", description=f"Confidence {confidence} for flood prediction in {data.region}")
            db.add(new_issue)
            await notify_alert(f"Low confidence prediction in {data.region}", 'warning')
        
        prediction_record = FloodPrediction(
            mar_may_rainfall=data.mar_may_rainfall,
            june_10days_rainfall=data.june_10days_rainfall,
            may_june_increase=data.may_june_increase,
            flood_probability=flood_probability,
            flood_prediction=int(flood_prediction),
            confidence=confidence,
            region=data.region,
            estimated_water_level=estimated_water_level,
            current_river_level=current_river_level
        )
        db.add(prediction_record)
        
        risk_level = "low" if flood_probability < 0.3 else "moderate" if flood_probability < 0.7 else "high"
        status = "active" if risk_level == "high" else "monitored"
        
        existing_disaster = db.query(Disaster).filter_by(location=data.region, type='flood').first()
        if existing_disaster:
            existing_disaster.severity = risk_level
            existing_disaster.status = status
            existing_disaster.prediction_accuracy = confidence * 100
            existing_disaster.last_updated = datetime.utcnow()
            disaster_id = existing_disaster.disaster_id
        else:
            new_disaster = Disaster(
                name=f"{data.region} Flood {'Risk' if risk_level != 'low' else 'Monitoring'}",
                type='flood',
                location=data.region,
                severity=risk_level,
                status=status,
                prediction_accuracy=confidence * 100,
                last_updated=datetime.utcnow()
            )
            db.add(new_disaster)
            db.commit()
            db.refresh(new_disaster)
            disaster_id = new_disaster.disaster_id
        
        damaged_area_percentage = flood_probability * 50
        damaged_area_percentage = max(0, min(100, damaged_area_percentage))
        new_assessment = DamageAssessment(
            disaster_id=disaster_id,
            damaged_area_percentage=damaged_area_percentage,
            confidence=confidence
        )
        db.add(new_assessment)
        
        if risk_level == "high":
            await notify_alert(f"High flood risk detected in {data.region}!", 'error')
        elif risk_level == "moderate":
            await notify_alert(f"Moderate flood risk in {data.region}", 'warning')
        
        db.commit()
        
        await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
        
        interpretation = {
            "low": "No significant flood risk expected",
            "moderate": "Moderate flood risk detected",
            "high": "High flood risk detected"
        }[risk_level]
        
        return JSONResponse({
            "prediction": int(flood_prediction),
            "probability": flood_probability,
            "confidence": confidence,
            "risk_level": risk_level,
            "interpretation": interpretation,
            "region": data.region,
            "estimated_water_level": estimated_water_level,
            "current_river_level": current_river_level,
            "evacuation_recommendation": evacuation_recommendation,
            "affected_population_estimate": affected_population_estimate,
            "input_parameters": {
                "mar_may_rainfall": data.mar_may_rainfall,
                "june_10days_rainfall": data.june_10days_rainfall,
                "may_june_increase": data.may_june_increase
            }
        })
    except ValueError as ve:
        logger.error(f"Invalid input data: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(ve)}")
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict-flood-batch")
async def predict_flood_batch(data: FloodBatchInput, db: Session = Depends(get_db)):
    global flood_model, flood_scaler
    if flood_model is None or flood_scaler is None:
        load_or_train_flood_model()
        if flood_model is None or flood_scaler is None:
            raise HTTPException(status_code=500, detail="Flood prediction model not initialized")

    try:
        results = []
        region_multipliers = {
            'Kerala': 1.2, 'Assam': 1.5, 'West Bengal': 1.4, 'Uttar Pradesh': 1.1
        }
        
        for pred_input in data.predictions:
            if pred_input.region not in VALID_REGIONS:
                raise HTTPException(status_code=400, detail="Invalid region in batch. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
            input_data = np.array([[pred_input.mar_may_rainfall, pred_input.june_10days_rainfall, pred_input.may_june_increase]])
            input_scaled = flood_scaler.transform(input_data)
            
            flood_prediction = flood_model.predict(input_scaled)[0]
            probabilities = flood_model.predict_proba(input_scaled)[0]
            flood_probability = float(probabilities[1])
            confidence = float(max(probabilities))
            
            region_multiplier = region_multipliers.get(pred_input.region, 1.0)
            flood_probability = min(flood_probability * region_multiplier, 1.0)
            
            estimated_water_level = round(flood_probability * 3 + random.uniform(0, 1), 2)
            current_river_level = round(5 + flood_probability * 2 + random.uniform(-0.5, 0.5), 2)
            evacuation_recommendation = "Yes" if flood_probability > 0.5 else "No"
            affected_population_estimate = int(100000 * flood_probability + random.randint(0, 10000))
            
            if confidence < 0.5:
                logger.warning(f"Low confidence batch prediction for region {pred_input.region}: {confidence}")
                new_issue = Issue(title="Low Confidence Batch Prediction", description=f"Confidence {confidence} for flood prediction in {pred_input.region}")
                db.add(new_issue)
                await notify_alert(f"Low confidence prediction in {pred_input.region}", 'warning')
            
            prediction_record = FloodPrediction(
                mar_may_rainfall=pred_input.mar_may_rainfall,
                june_10days_rainfall=pred_input.june_10days_rainfall,
                may_june_increase=pred_input.may_june_increase,
                flood_probability=flood_probability,
                flood_prediction=int(flood_prediction),
                confidence=confidence,
                region=pred_input.region,
                estimated_water_level=estimated_water_level,
                current_river_level=current_river_level
            )
            db.add(prediction_record)
            
            risk_level = "low" if flood_probability < 0.3 else "moderate" if flood_probability < 0.7 else "high"
            status = "active" if risk_level == "high" else "monitored"
            
            existing_disaster = db.query(Disaster).filter_by(location=pred_input.region, type='flood').first()
            if existing_disaster:
                existing_disaster.severity = risk_level
                existing_disaster.status = status
                existing_disaster.prediction_accuracy = confidence * 100
                existing_disaster.last_updated = datetime.utcnow()
                disaster_id = existing_disaster.disaster_id
            else:
                new_disaster = Disaster(
                    name=f"{pred_input.region} Flood {'Risk' if risk_level != 'low' else 'Monitoring'}",
                    type='flood',
                    location=pred_input.region,
                    severity=risk_level,
                    status=status,
                    prediction_accuracy=confidence * 100,
                    last_updated=datetime.utcnow()
                )
                db.add(new_disaster)
                db.commit()
                db.refresh(new_disaster)
                disaster_id = new_disaster.disaster_id
            
            damaged_area_percentage = flood_probability * 50
            damaged_area_percentage = max(0, min(100, damaged_area_percentage))
            new_assessment = DamageAssessment(
                disaster_id=disaster_id,
                damaged_area_percentage=damaged_area_percentage,
                confidence=confidence
            )
            db.add(new_assessment)
            
            if risk_level == "high":
                await notify_alert(f"High flood risk detected in {pred_input.region} (batch)!", 'error')
            elif risk_level == "moderate":
                await notify_alert(f"Moderate flood risk in {pred_input.region} (batch)", 'warning')
            
            results.append({
                "prediction": int(flood_prediction),
                "probability": flood_probability,
                "confidence": confidence,
                "risk_level": risk_level,
                "estimated_water_level": estimated_water_level,
                "current_river_level": current_river_level,
                "evacuation_recommendation": evacuation_recommendation,
                "affected_population_estimate": affected_population_estimate,
                "region": pred_input.region,
                "input_parameters": {
                    "mar_may_rainfall": pred_input.mar_may_rainfall,
                    "june_10days_rainfall": pred_input.june_10days_rainfall,
                    "may_june_increase": pred_input.may_june_increase
                }
            })
        
        db.commit()
        
        await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
        
        return JSONResponse({"predictions": results})
    except ValueError as ve:
        logger.error(f"Invalid batch input data: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(ve)}")
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.get("/api/flood-predictions/history")
async def get_flood_prediction_history(limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    try:
        predictions = db.query(FloodPrediction).order_by(FloodPrediction.predicted_at.desc()).offset(offset).limit(limit).all()
        total = db.query(FloodPrediction).count()
        
        return JSONResponse({
            "data": [{
                "id": p.id,
                "mar_may_rainfall": p.mar_may_rainfall,
                "june_10days_rainfall": p.june_10days_rainfall,
                "may_june_increase": p.may_june_increase,
                "flood_probability": p.flood_probability,
                "flood_prediction": p.flood_prediction,
                "confidence": p.confidence,
                "region": p.region,
                "estimated_water_level": p.estimated_water_level,
                "current_river_level": p.current_river_level,
                "predicted_at": p.predicted_at.isoformat()
            } for p in predictions],
            "total": total
        })
    except Exception as e:
        logger.error(f"Error fetching prediction history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching prediction history: {str(e)}")

@app.get("/api/flood-model/stats")
async def get_flood_model_stats(db: Session = Depends(get_db)):
    global flood_model, flood_scaler
    if flood_model is None or flood_scaler is None:
        await notify_alert("Flood model not initialized", 'error')
        raise HTTPException(status_code=500, detail="Flood prediction model not initialized")

    try:
        agent = db.query(Agent).filter_by(name='Flood Prediction Agent').first()
        accuracy = agent.accuracy if agent else 86.08

        return JSONResponse({
            "model_type": "XGBoost Classifier",
            "parameters": {
                "objective": "binary:logistic",
                "n_estimators": 100,
                "learning_rate": 0.1,
                "max_depth": 5,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "gamma": 0.1,
                "random_state": 42
            },
            "features": ["March-May Rainfall", "June 10-day Rainfall", "May-June Increase"],
            "accuracy": accuracy,
            "training_data_period": "1901-2015",
            "region": "Multiple Indian States",
            "model_status": "active"
        })
    except Exception as e:
        logger.error(f"Error retrieving model stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving model stats: {str(e)}")

# System Health & Monitoring Endpoints
@app.get("/api/system-status")
async def system_status(db: Session = Depends(get_db)):
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        cpu_percent = psutil.cpu_percent(interval=0.2)
        memory = psutil.virtual_memory()
        services = [
            {"name": "API Server", "status": "operational" if cpu_percent < 90 else "degraded"},
            {"name": "Database", "status": "operational"},
            {"name": "SocketIO", "status": "operational"},
            {"name": "Model Service", "status": "operational" if flood_model else "down"}
        ]
        if cpu_percent > 90:
            await notify_alert("High CPU usage detected!", 'warning')
        if memory.percent > 90:
            await notify_alert("High memory usage detected!", 'warning')
        return JSONResponse({
            "uptime_seconds": uptime_seconds,
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "hostname": platform.node(),
            "services": services
        })
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitoring/metrics")
async def monitoring_metrics(db: Session = Depends(get_db)):
    satellites_active = random.randint(18, 28)
    weather_stations = random.randint(1000, 1400)
    datapoints_per_min = random.randint(9000, 15000)
    if satellites_active < 20:
        await notify_alert("Low number of active satellites!", 'warning')
    if weather_stations < 1200:
        await notify_alert("Low number of weather stations!", 'warning')
    return JSONResponse({
        "satellites_active": satellites_active,
        "weather_stations": weather_stations,
        "datapoints_per_min": datapoints_per_min
    })

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.get("/api/_debug_routes")
async def debug_routes():
    try:
        return {"routes": [
            {"path": r.path, "name": getattr(r.endpoint, "__name__", str(r.endpoint)), "methods": list(r.methods or [])}
            for r in app.router.routes
        ]}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/monitoring/reports")
async def monitoring_reports(db: Session = Depends(get_db)):
    try:
        flood_predictions = db.query(FloodPrediction).order_by(FloodPrediction.predicted_at.desc()).all()
        high_risk_regions = {}
        for p in flood_predictions:
            if p.flood_probability > 0.5:
                high_risk_regions[p.region] = high_risk_regions.get(p.region, 0) + 1
        
        system_health_response = await system_status(db)
        system_health = json.loads(system_health_response.body)
        
        active_alerts = db.query(Alert).filter_by(acknowledged=False).count()
        
        old_alerts = db.query(Alert).filter(Alert.acknowledged == False, Alert.time < datetime.utcnow() - timedelta(days=1)).all()
        for alert in old_alerts:
            alert.acknowledged = True
        db.commit()
        
        flood_prediction_data = [{
            "id": p.id,
            "region": p.region,
            "probability": p.flood_probability,
            "risk_level": "low" if p.flood_probability < 0.3 else "moderate" if p.flood_probability < 0.7 else "high",
            "estimated_water_level": p.estimated_water_level,
            "current_river_level": p.current_river_level,
            "predicted_at": p.predicted_at.isoformat()
        } for p in flood_predictions]
        
        return JSONResponse({
            "high_risk_predictions": high_risk_regions,
            "system_health": system_health,
            "active_alerts": active_alerts,
            "flood_predictions": flood_prediction_data
        })
    except Exception as e:
        logger.error(f"Error in monitoring reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating monitoring report: {str(e)}")

@app.post("/api/monitoring/retrain-model")
async def retrain_model(db: Session = Depends(get_db)):
    global flood_model, flood_scaler
    try:
        load_or_train_flood_model()
        await notify_alert("Flood model retrained successfully with XGBoost", 'info')
        return JSONResponse({"message": "Model retrained successfully"})
    except ValueError as ve:
        logger.error(f"Value error retraining model: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid data for retraining: {str(ve)}")
    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retraining model: {str(e)}")

@app.get("/api/monitoring/external-sources")
async def check_external_sources(db: Session = Depends(get_db)):
    sources = [
        {"name": "Weather API", "status": random.choice(["operational", "degraded", "down"]), "latency_ms": random.randint(50, 200)},
        {"name": "Satellite Feed", "status": random.choice(["operational", "degraded", "down"]), "latency_ms": random.randint(100, 300)},
        {"name": "River Level Sensor", "status": random.choice(["operational", "degraded", "down"]), "latency_ms": random.randint(20, 100)}
    ]
    for source in sources:
        if source["status"] != "operational":
            await notify_alert(f"External source {source['name']} is {source['status']}!", 'error')
    return JSONResponse({"sources": sources})

# Floods (Active Disasters)
@app.get("/api/floods")
async def list_floods(db: Session = Depends(get_db)):
    floods = db.query(Disaster).filter_by(type='flood').all()
    for f in floods:
        if f.last_updated and f.last_updated < datetime.utcnow() - timedelta(days=1):
            await notify_alert(f"Stale disaster data for {f.location}", 'warning')
    return [{
        "id": f.disaster_id,
        "name": f.name,
        "region": f.location,
        "severity": f.severity,
        "status": f.status,
        "prediction_accuracy": f.prediction_accuracy,
        "start_time": f.start_time.isoformat(),
        "end_time": f.end_time.isoformat() if f.end_time else None,
        "last_updated": f.last_updated.isoformat() if f.last_updated else None
    } for f in floods]

@app.post("/api/floods")
async def create_flood(data: FloodInput, db: Session = Depends(get_db)):
    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
    f = Disaster(name=data.name, type='flood', location=data.region, severity=data.severity, status=data.status, prediction_accuracy=data.prediction_accuracy, last_updated=datetime.utcnow())
    db.add(f)
    db.commit()
    await notify_alert(f"New flood disaster created for {data.region}", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"id": f.disaster_id})

@app.put("/api/floods/{flood_id}")
async def update_flood(flood_id: int, data: FloodInput, db: Session = Depends(get_db)):
    if data.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region. Valid regions are: Kerala, Assam, West Bengal, Uttar Pradesh")
    f = db.query(Disaster).filter_by(disaster_id=flood_id, type='flood').first()
    if not f:
        raise HTTPException(status_code=404, detail="Flood not found")
    f.name = data.name
    f.location = data.region
    f.severity = data.severity
    f.status = data.status
    f.prediction_accuracy = data.prediction_accuracy
    f.last_updated = datetime.utcnow()
    db.commit()
    await notify_alert(f"Flood disaster updated for {data.region}", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": "Updated"})

@app.post("/api/floods/{flood_id}/resolve")
async def resolve_flood(flood_id: int, db: Session = Depends(get_db)):
    f = db.query(Disaster).filter_by(disaster_id=flood_id, type='flood').first()
    if not f:
        raise HTTPException(status_code=404, detail="Flood not found")
    f.status = 'resolved'
    f.end_time = datetime.utcnow()
    f.last_updated = datetime.utcnow()
    db.commit()
    await notify_alert(f"Flood disaster resolved for {f.location}", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": "Resolved"})

@app.post("/api/floods/{flood_id}/approve")
async def approve_flood(flood_id: int, db: Session = Depends(get_db)):
    f = db.query(Disaster).filter_by(disaster_id=flood_id, type='flood').first()
    if not f:
        raise HTTPException(status_code=404, detail="Flood not found")
    f.status = 'approved'
    f.last_updated = datetime.utcnow()
    db.commit()
    await notify_alert(f"Flood disaster approved for {f.location}", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": "Approved"})

@app.delete("/api/floods/{flood_id}")
async def delete_flood(flood_id: int, db: Session = Depends(get_db)):
    f = db.query(Disaster).filter_by(disaster_id=flood_id, type='flood').first()
    if not f:
        raise HTTPException(status_code=404, detail="Flood not found")
    db.delete(f)
    db.commit()
    await notify_alert(f"Flood disaster deleted for {f.location}", 'info')
    await sio.emit('dashboard-update', {'disasters': await get_dashboard_data(db)})
    return JSONResponse({"message": "Deleted"})

@app.get("/api/recovery-dashboard")
async def recovery_dashboard(db: Session = Depends(get_db)):
    try:
        dashboard_data = await get_dashboard_data(db)
        if not dashboard_data:
            logger.warning("No recovery data available")
            return JSONResponse({"disasters": [], "message": "No active or monitored flood disasters found. Please check if disasters are populated."})
        return JSONResponse({"disasters": dashboard_data})
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@app.get("/api/recovery")
async def get_recovery(db: Session = Depends(get_db)):
    return await recovery_dashboard(db)

# Impact Prediction
def predict_impact(data: ImpactInput):
    global recovery_model
    if recovery_model is None:
        train_recovery_model()
        if recovery_model is None:
            raise HTTPException(status_code=500, detail="Recovery model not initialized")
    try:
        severity_map = {"low": 1, "moderate": 2, "high": 3, "critical": 4}
        severity_value = severity_map.get(data.severity, 2)  # Default to moderate if invalid
        input_data = np.array([[data.flood_probability, severity_value, data.population_density]])
        prediction = recovery_model.predict(input_data)[0]
        return {
            "displaced_people": int(prediction[0]),
            "recovery_cost": int(prediction[1]),
            "required_resources": int(prediction[2])
        }
    except Exception as e:
        logger.error(f"Impact prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Impact prediction error: {str(e)}")

# Risk Assessment
@app.get("/api/risk-assessment")
async def risk_assessment(db: Session = Depends(get_db)):
    items = []
    for r in VALID_REGIONS:
        latest = db.query(FloodPrediction).filter_by(region=r).order_by(FloodPrediction.predicted_at.desc()).first()
        prob = latest.flood_probability if latest else round(random.uniform(0.1, 0.9), 2)
        bucket = 'low' if prob < 0.3 else ('moderate' if prob < 0.7 else 'high')
        accuracy = latest.confidence if latest else round(random.uniform(0.8, 0.99), 2)
        items.append({"region": r, "probability": prob, "bucket": bucket, "accuracy": accuracy})
    return JSONResponse({"items": items})

# Issues
@app.get("/api/issues")
async def get_issues(db: Session = Depends(get_db)):
    rows = db.query(Issue).order_by(Issue.created_at.desc()).all()
    return [{
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat()
    } for r in rows]

@app.post("/api/issues")
async def create_issue(data: IssueInput, db: Session = Depends(get_db)):
    row = Issue(title=data.title, description=data.description, status=data.status or 'open')
    db.add(row)
    db.commit()
    await notify_alert(f"New issue created: {data.title}", 'info')
    return JSONResponse({"id": row.id})

@app.put("/api/issues/{issue_id}")
async def update_issue(issue_id: int, data: IssueInput, db: Session = Depends(get_db)):
    row = db.query(Issue).filter_by(id=issue_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Issue not found")
    row.title = data.title
    row.description = data.description
    row.status = data.status or row.status
    row.updated_at = datetime.utcnow()
    db.commit()
    await notify_alert(f"Issue updated: {data.title}", 'info')
    return JSONResponse({"message": "Updated"})

@app.post("/api/issues/{issue_id}/resolve")
async def resolve_issue(issue_id: int, db: Session = Depends(get_db)):
    row = db.query(Issue).filter_by(id=issue_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Issue not found")
    row.status = 'resolved'
    row.updated_at = datetime.utcnow()
    db.commit()
    await notify_alert(f"Issue resolved: {row.title}", 'info')
    return JSONResponse({"message": "Resolved"})

@app.delete("/api/issues/{issue_id}")
async def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    row = db.query(Issue).filter_by(id=issue_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(row)
    db.commit()
    await notify_alert(f"Issue deleted: {row.title}", 'info')
    return JSONResponse({"message": "Deleted"})

# Analytics
@app.get("/api/analytics-overview")
async def analytics_overview(db: Session = Depends(get_db)):
    floods_total = db.query(Disaster).filter_by(type='flood').count()
    regions_breakdown = {}
    for f in db.query(Disaster).filter_by(type='flood').all():
        regions_breakdown[f.location] = regions_breakdown.get(f.location, 0) + 1
    supplies_used = {
        "food": random.randint(500, 1200),
        "water": random.randint(800, 1600),
        "medical": random.randint(200, 600),
        "boats": random.randint(20, 80)
    }
    response_times = [random.randint(2, 15) for _ in range(50)]
    return JSONResponse({
        "floods_total": floods_total,
        "regions_breakdown": regions_breakdown,
        "supplies_used": supplies_used,
        "response_times": response_times
    })

# Signup Endpoint
@app.post("/api/signup")
async def signup(data: SignupData, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=data.email).first() or db.query(User).filter_by(username=data.username).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    new_user = User(
        name=data.name,
        username=data.username,
        phone=data.phone,
        email=data.email,
        password=data.password,
        gender=data.gender,
        role=data.role
    )
    db.add(new_user)
    db.commit()
    await notify_alert(f"New user signed up: {data.username}", 'info')
    return JSONResponse({"message": "Account created successfully!"})

@app.get("/api/alerts")
async def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.time.desc()).all()
    return JSONResponse({
        "data": [{
            "alert_id": a.alert_id,
            "title": a.title,
            "message": a.message,
            "type": a.type,
            "time": a.time.isoformat(),
            "acknowledged": a.acknowledged
        } for a in alerts]
    })

class AlertCreate(BaseModel):
    title: str
    message: str
    risk: str = "moderate"  # one of: low|moderate|high
    disaster_id: Optional[int] = None

# Admin creates/sends an alert
@app.post("/api/alerts/send")
async def send_alert(data: AlertCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"/api/alerts/send called with: title={data.title}, risk={data.risk}")
        title = (data.title or "Alert").strip()
        message = (data.message or "").strip()
        risk = (data.risk or "moderate").lower()
        if risk not in {"low", "moderate", "high"}:
            risk = "moderate"
        # Map risk to type for UI
        risk_type = "error" if risk == "high" else ("warning" if risk == "moderate" else "success")

        alert = Alert(
            disaster_id=data.disaster_id,
            type=risk_type,
            title=title,
            message=message,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Push to sockets for any connected dashboards, never fail request
        try:
            await notify_alert(f"{title}: {message}", 'error' if risk == 'high' else ('warning' if risk == 'moderate' else 'info'))
        except Exception as ne:
            logger.warning(f"notify_alert failed (non-fatal): {ne}")

        return JSONResponse({
            "message": "Alert sent",
            "alert": {
                "alert_id": alert.alert_id,
                "title": alert.title,
                "message": alert.message,
                "type": alert.type,
                "time": alert.time.isoformat(),
            }
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending alert: {str(e)}")

# Backward-compatible alias without /api prefix, in case frontend calls /alerts/send
@app.post("/alerts/send")
async def send_alert_alias(data: AlertCreate, db: Session = Depends(get_db)):
    return await send_alert(data, db)

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as acknowledged/resolved.
    Frontend can hide acknowledged alerts. Returns the updated alert.
    """
    try:
        alert: Alert | None = db.query(Alert).filter_by(alert_id=alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.acknowledged = True
        db.commit()
        # Notify connected dashboards to refresh if listening
        try:
            await sio.emit('alert-update', {'alert_id': alert_id, 'acknowledged': True})
        except Exception:
            pass
        return JSONResponse({
            "message": "Alert acknowledged",
            "alert": {
                "alert_id": alert.alert_id,
                "title": alert.title,
                "message": alert.message,
                "type": alert.type,
                "time": alert.time.isoformat(),
                "acknowledged": alert.acknowledged
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve alert")

# Login Endpoint
@app.post("/api/login")
async def login(data: LoginData, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for username: {data.username}, role: {data.role}")
    
    # Normalize inputs
    input_username = (data.username or "").strip()
    input_password = (data.password or "").strip()
    requested_role = (data.role or "").strip().lower()

    # Case-insensitive username match
    user = db.query(User).filter(func.lower(User.username) == input_username.lower()).first()
    if not user:
        logger.error(f"User not found: {input_username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    logger.info(f"Found user: {user.username}, role: {user.role}, password match: {user.password == input_password}")
    
    if user.password != input_password:
        logger.error(f"Password mismatch for user: {input_username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if the user's role matches the requested role
    if user.role == "admin" and requested_role != "admin":
        logger.error(f"Role mismatch: user role is {user.role}, requested role is {data.role}")
        raise HTTPException(status_code=403, detail="Admin users must select admin role")
    elif user.role == "user" and requested_role != "user":
        logger.error(f"Role mismatch: user role is {user.role}, requested role is {data.role}")
        raise HTTPException(status_code=403, detail="Regular users must select user role")
    
    await notify_alert(f"User logged in: {data.username}", 'info')
    logger.info(f"Login successful for user: {data.username}, role: {user.role}")
    
    # Return role and user info for frontend redirection
    return JSONResponse({
        "message": "Login successful",
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "redirect": "/admin" if user.role == "admin" else "/UserDashboard"  # Suggest redirect path
    })

# Signup Endpoint (regular users)
@app.post("/api/signup")
async def signup(data: SignupData, db: Session = Depends(get_db)):
    try:
        username = (data.username or "").strip()
        email = (data.email or "").strip().lower()
        password = (data.password or "").strip()
        role = (data.role or "user").strip().lower()

        if not username or not email or not password:
            raise HTTPException(status_code=400, detail="Username, email, and password are required")

        # Prevent creating admin via open signup
        if role not in {"user"}:
            role = "user"

        # Uniqueness checks
        if db.query(User).filter(func.lower(User.username) == username.lower()).first():
            raise HTTPException(status_code=409, detail="Username already exists")
        if db.query(User).filter(func.lower(User.email) == email.lower()).first():
            raise HTTPException(status_code=409, detail="Email already exists")

        user = User(
            name=(data.name or username),
            username=username,
            phone=(data.phone or ""),
            email=email,
            password=password,  # Plain text to match existing logic
            gender=(data.gender or "Not Specified"),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return JSONResponse({
            "message": "Signup successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")

# Debug endpoint to check admin user
@app.get("/api/debug/admin")
async def debug_admin(db: Session = Depends(get_db)):
    admin_user = db.query(User).filter_by(username="admin").first()
    if admin_user:
        return {
            "exists": True,
            "username": admin_user.username,
            "role": admin_user.role,
            "password": admin_user.password,
            "email": admin_user.email
        }
    else:
        return {"exists": False}

# Users listing and count
@app.get("/api/users")
async def list_users(db: Session = Depends(get_db)):
    rows = db.query(User).all()
    return [{
        "id": u.id,
        "name": u.name,
        "username": u.username,
        "email": u.email,
        "role": u.role
    } for u in rows]

@app.get("/api/users/count")
async def users_count(db: Session = Depends(get_db)):
    count = db.query(User).count()
    return {"count": count}

# Get specific user by ID
@app.get("/api/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "gender": user.gender,
            "role": user.role,
            "emergency_contact": getattr(user, 'emergency_contact', ''),
            "address": getattr(user, 'address', ''),
            "medical_conditions": getattr(user, 'medical_conditions', '')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update user profile
@app.put("/api/users/{user_id}")
async def update_user_profile(user_id: int, data: dict, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Allowed fields to update
        for field in ["name", "username", "phone", "email", "gender", "password", "emergency_contact", "address", "medical_conditions"]:
            if field in data and data[field] is not None:
                setattr(user, field, data[field])

        db.commit()
        db.refresh(user)
        return JSONResponse({
            "message": "Profile updated",
            "user": {
                "id": user.id,
                "name": user.name,
                "username": user.username,
                "phone": user.phone,
                "email": user.email,
                "gender": user.gender,
                "role": user.role,
                "emergency_contact": user.emergency_contact,
                "address": user.address,
                "medical_conditions": user.medical_conditions
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

# Update Footprint Endpoint
@app.post("/api/update-footprint")
async def update_footprint(data: FootprintData, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=data.user_id).first()
    if not user or user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized or invalid user")

    electricity_factor = 0.85
    car_factor = 0.4
    flight_factor = 0.15
    recycling_reduction = 50.0

    total_carbon = (data.electricity_kwh * electricity_factor) + (data.car_miles * car_factor) + (data.flights_miles * flight_factor)
    if data.recycling:
        total_carbon -= recycling_reduction
    total_carbon = max(total_carbon, 0)

    existing_footprint = db.query(CarbonFootprint).filter_by(user_id=data.user_id).first()
    if existing_footprint:
        existing_footprint.electricity_kwh = data.electricity_kwh
        existing_footprint.car_miles = data.car_miles
        existing_footprint.flights_miles = data.flights_miles
        existing_footprint.recycling = data.recycling
        existing_footprint.carbon_value = total_carbon
        existing_footprint.calculated_at = datetime.utcnow()
    else:
        new_footprint = CarbonFootprint(
            user_id=data.user_id,
            electricity_kwh=data.electricity_kwh,
            car_miles=data.car_miles,
            flights_miles=data.flights_miles,
            recycling=data.recycling,
            carbon_value=total_carbon
        )
        db.add(new_footprint)
    db.commit()
    return JSONResponse({"message": "Footprint updated successfully", "carbon_value": total_carbon})

# Wildfire Batch Prediction Endpoint
@app.post("/api/wildfire-batch-prediction")
async def wildfire_batch_prediction(data: WildfireBatchInput, db: Session = Depends(get_db)):
    X = np.array([[d.temperature, d.humidity, d.wind_speed, d.ndvi, d.soil_moisture] for d in data.data])
    model = getattr(init_db, 'model', None)
    if not model:
        raise HTTPException(status_code=500, detail="Model not trained")
    predictions = model.predict(X)
    confidence = np.clip(np.random.uniform(0.8, 1.0, len(predictions)), 0, 1)
    result = [{"risk_probability": float(pred), "confidence": float(conf)} for pred, conf in zip(predictions, confidence)]
    for pred in result:
        db.add(WildfireData(
            temperature=pred['risk_probability'] * 30,
            humidity=100 - (pred['risk_probability'] * 50),
            wind_speed=10 + (pred['risk_probability'] * 10),
            ndvi=0.5 - (pred['risk_probability'] * 0.3),
            soil_moisture=20 - (pred['risk_probability'] * 10),
            risk_probability=pred['risk_probability'],
            confidence=pred['confidence']
        ))
    db.commit()
    return JSONResponse({"predictions": result})

# Image Classification Endpoint
@app.post("/api/classify-image")
async def classify_image_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        prediction = classify_image(contents)
        db.add(WildfireData(
            temperature=0,
            humidity=0,
            wind_speed=0,
            ndvi=0,
            soil_moisture=0,
            risk_probability=prediction['wildfire_confidence'] if prediction['label'] == 'Wildfire' else 1 - prediction['wildfire_confidence'],
            confidence=prediction['confidence'] / 100
        ))
        db.commit()
        return JSONResponse(prediction)
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Simulated classification function
def classify_image(image_data):
    img = Image.open(io.BytesIO(image_data)).convert('RGB').resize((224, 224))
    confidence = random.uniform(0.6, 1.0)
    label = "Wildfire" if random.random() > 0.3 else "No Wildfire"
    wildfire_confidence = confidence if label == "Wildfire" else 1 - confidence
    no_wildfire_confidence = 1 - confidence if label == "Wildfire" else confidence
    return {
        "label": label,
        "confidence": confidence * 100,
        "wildfire_confidence": wildfire_confidence,
        "no_wildfire_confidence": no_wildfire_confidence
    }

# ============ INVENTORY & RESOURCE REQUEST ENDPOINTS ============

@app.get("/api/inventory")
async def get_inventory(db: Session = Depends(get_db)):
    """Get all inventory items"""
    items = db.query(Inventory).all()
    return [{
        "id": item.id,
        "resource_name": item.resource_name,
        "quantity": item.quantity,
        "unit": item.unit,
        "last_updated": item.last_updated.isoformat()
    } for item in items]

@app.post("/api/inventory")
async def add_inventory(data: dict, db: Session = Depends(get_db)):
    """Add or update inventory item"""
    try:
        resource_name = data.get("resource_name")
        quantity = data.get("quantity", 0)
        unit = data.get("unit", "units")
        
        existing = db.query(Inventory).filter_by(resource_name=resource_name).first()
        if existing:
            existing.quantity = quantity
            existing.unit = unit
            existing.last_updated = datetime.utcnow()
            db.commit()
            return JSONResponse({"message": "Inventory updated", "id": existing.id})
        else:
            new_item = Inventory(
                resource_name=resource_name,
                quantity=quantity,
                unit=unit
            )
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            return JSONResponse({"message": "Inventory added", "id": new_item.id}, status_code=201)
    except Exception as e:
        logger.error(f"Error adding inventory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resource-requests")
async def create_resource_request(data: dict, db: Session = Depends(get_db)):
    """User creates a resource request"""
    try:
        user_id = data.get("user_id", 1)  # Default to user 1 if not provided
        resource_name = data.get("resource_name")
        quantity = data.get("quantity")
        notes = data.get("notes", "")
        
        if not resource_name or not quantity:
            raise HTTPException(status_code=400, detail="resource_name and quantity are required")
        
        request = ResourceRequest(
            user_id=user_id,
            resource_name=resource_name,
            quantity=quantity,
            notes=notes,
            status='pending'
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        
        return JSONResponse({
            "message": "Resource request created",
            "request_id": request.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating resource request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resource-requests")
async def get_resource_requests(status: str = None, db: Session = Depends(get_db)):
    """Get all resource requests, optionally filtered by status"""
    query = db.query(ResourceRequest)
    if status:
        query = query.filter_by(status=status)
    
    requests = query.order_by(ResourceRequest.requested_at.desc()).all()
    return [{
        "id": req.id,
        "user_id": req.user_id,
        "user_name": req.user.name if req.user else "Unknown",
        "resource_name": req.resource_name,
        "quantity": req.quantity,
        "status": req.status,
        "requested_at": req.requested_at.isoformat(),
        "responded_at": req.responded_at.isoformat() if req.responded_at else None,
        "notes": req.notes
    } for req in requests]

@app.post("/api/resource-requests/{request_id}/approve")
async def approve_resource_request(request_id: int, db: Session = Depends(get_db)):
    """Admin approves a resource request"""
    try:
        request = db.query(ResourceRequest).filter_by(id=request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Update inventory
        inventory_item = db.query(Inventory).filter_by(resource_name=request.resource_name).first()
        if inventory_item:
            if inventory_item.quantity >= request.quantity:
                inventory_item.quantity -= request.quantity
                inventory_item.last_updated = datetime.utcnow()
            else:
                raise HTTPException(status_code=400, detail="Insufficient inventory")
        
        # Update request status
        request.status = 'approved'
        request.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Request approved"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resource-requests/{request_id}/reject")
async def reject_resource_request(request_id: int, db: Session = Depends(get_db)):
    """Admin rejects a resource request"""
    try:
        request = db.query(ResourceRequest).filter_by(id=request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request.status = 'rejected'
        request.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Request rejected"})
    except Exception as e:
        logger.error(f"Error rejecting request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ COMMUNITY REPORTS ENDPOINTS ============

@app.post("/api/community-reports")
async def create_community_report(data: dict, db: Session = Depends(get_db)):
    """User submits a community report"""
    try:
        user_id = data.get("user_id", 1)  # Default to user 1
        report_type = data.get("report_type", "Other")
        description = data.get("description", "")
        location = data.get("location", "")
        
        if not description:
            raise HTTPException(status_code=400, detail="Description is required")
        
        report = CommunityReport(
            user_id=user_id,
            report_type=report_type,
            description=description,
            location=location,
            status='open'
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return JSONResponse({
            "message": "Report submitted successfully",
            "report_id": report.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating community report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/community-reports")
async def get_community_reports(status: str = None, db: Session = Depends(get_db)):
    """Get all community reports, optionally filtered by status"""
    query = db.query(CommunityReport)
    if status:
        query = query.filter_by(status=status)
    
    reports = query.order_by(CommunityReport.reported_at.desc()).all()
    return [{
        "id": report.id,
        "user_id": report.user_id,
        "user_name": report.user.name if report.user else "Anonymous",
        "report_type": report.report_type,
        "description": report.description,
        "location": report.location,
        "status": report.status,
        "reported_at": report.reported_at.isoformat(),
        "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None
    } for report in reports]

@app.post("/api/community-reports/{report_id}/resolve")
async def resolve_community_report(report_id: int, db: Session = Depends(get_db)):
    """Admin resolves a community report"""
    try:
        report = db.query(CommunityReport).filter_by(id=report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.status = 'resolved'
        report.resolved_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Report resolved"})
    except Exception as e:
        logger.error(f"Error resolving report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/community-reports/{report_id}/investigate")
async def investigate_community_report(report_id: int, db: Session = Depends(get_db)):
    """Admin marks report as under investigation"""
    try:
        report = db.query(CommunityReport).filter_by(id=report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.status = 'investigating'
        db.commit()
        
        return JSONResponse({"message": "Report marked as investigating"})
    except Exception as e:
        logger.error(f"Error updating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ SHELTER MANAGEMENT ENDPOINTS ============

@app.get("/api/shelters")
async def get_shelters(db: Session = Depends(get_db)):
    """Get all shelters"""
    shelters = db.query(Shelter).order_by(Shelter.created_at.desc()).all()
    return [{
        "id": shelter.id,
        "name": shelter.name,
        "capacity": shelter.capacity,
        "assigned_region": shelter.assigned_region,
        "beds_available": shelter.beds_available,
        "has_food": shelter.has_food,
        "has_medical": shelter.has_medical,
        "distance_km": shelter.distance_km,
        "created_at": shelter.created_at.isoformat(),
        "updated_at": shelter.updated_at.isoformat()
    } for shelter in shelters]

@app.post("/api/shelters")
async def create_shelter(data: dict, db: Session = Depends(get_db)):
    """Admin creates a new shelter"""
    try:
        name = data.get("name", "")
        capacity = data.get("capacity", 0)
        assigned_region = data.get("assigned_region", "")
        beds_available = data.get("beds_available", capacity)
        has_food = data.get("has_food", True)
        has_medical = data.get("has_medical", True)
        distance_km = data.get("distance_km", 0.0)
        
        if not name or not capacity or not assigned_region:
            raise HTTPException(status_code=400, detail="Name, capacity, and region are required")
        
        shelter = Shelter(
            name=name,
            capacity=capacity,
            assigned_region=assigned_region,
            beds_available=beds_available,
            has_food=has_food,
            has_medical=has_medical,
            distance_km=distance_km
        )
        db.add(shelter)
        db.commit()
        db.refresh(shelter)
        
        return JSONResponse({
            "message": "Shelter created successfully",
            "shelter_id": shelter.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shelter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/shelters/{shelter_id}")
async def update_shelter(shelter_id: int, data: dict, db: Session = Depends(get_db)):
    """Admin updates a shelter"""
    try:
        shelter = db.query(Shelter).filter_by(id=shelter_id).first()
        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")
        
        if "name" in data:
            shelter.name = data["name"]
        if "capacity" in data:
            shelter.capacity = data["capacity"]
        if "assigned_region" in data:
            shelter.assigned_region = data["assigned_region"]
        if "beds_available" in data:
            shelter.beds_available = data["beds_available"]
        if "has_food" in data:
            shelter.has_food = data["has_food"]
        if "has_medical" in data:
            shelter.has_medical = data["has_medical"]
        if "distance_km" in data:
            shelter.distance_km = data["distance_km"]
        
        shelter.updated_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Shelter updated successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shelter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ DONATION ENDPOINTS ============

@app.post("/api/donations")
async def create_donation(data: dict, db: Session = Depends(get_db)):
    """User makes a donation"""
    try:
        amount = data.get("amount", 0)
        donor_name = data.get("donor_name", "")
        donor_email = data.get("donor_email", "")
        user_id = data.get("user_id", 1)
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        donation = Donation(
            user_id=user_id,
            amount=amount,
            donor_name=donor_name,
            donor_email=donor_email,
            status='pending'
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        
        return JSONResponse({
            "message": "Donation submitted successfully",
            "donation_id": donation.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating donation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/donations")
async def get_donations(status: str = None, db: Session = Depends(get_db)):
    """Get all donations"""
    query = db.query(Donation)
    if status:
        query = query.filter_by(status=status)
    
    donations = query.order_by(Donation.donated_at.desc()).all()
    return [{
        "id": donation.id,
        "user_id": donation.user_id,
        "amount": donation.amount,
        "donor_name": donation.donor_name,
        "donor_email": donation.donor_email,
        "status": donation.status,
        "donated_at": donation.donated_at.isoformat(),
        "responded_at": donation.responded_at.isoformat() if donation.responded_at else None
    } for donation in donations]

@app.post("/api/donations/{donation_id}/accept")
async def accept_donation(donation_id: int, db: Session = Depends(get_db)):
    """Admin accepts a donation"""
    try:
        donation = db.query(Donation).filter_by(id=donation_id).first()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        donation.status = 'accepted'
        donation.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Donation accepted"})
    except Exception as e:
        logger.error(f"Error accepting donation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/donations/{donation_id}/reject")
async def reject_donation(donation_id: int, db: Session = Depends(get_db)):
    """Admin rejects a donation"""
    try:
        donation = db.query(Donation).filter_by(id=donation_id).first()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        donation.status = 'rejected'
        donation.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Donation rejected"})
    except Exception as e:
        logger.error(f"Error rejecting donation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ITEM PICKUP ENDPOINTS ============

@app.post("/api/item-pickups")
async def create_item_pickup(data: dict, db: Session = Depends(get_db)):
    """User schedules item pickup"""
    try:
        items = data.get("items", "")
        pickup_address = data.get("pickup_address", "")
        contact_number = data.get("contact_number", "")
        user_id = data.get("user_id", 1)
        
        if not items or not pickup_address:
            raise HTTPException(status_code=400, detail="Items and address are required")
        
        pickup = ItemPickup(
            user_id=user_id,
            items=items,
            pickup_address=pickup_address,
            contact_number=contact_number,
            status='pending'
        )
        db.add(pickup)
        db.commit()
        db.refresh(pickup)
        
        return JSONResponse({
            "message": "Pickup scheduled successfully",
            "pickup_id": pickup.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating pickup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/item-pickups")
async def get_item_pickups(status: str = None, db: Session = Depends(get_db)):
    """Get all item pickups"""
    query = db.query(ItemPickup)
    if status:
        query = query.filter_by(status=status)
    
    pickups = query.order_by(ItemPickup.requested_at.desc()).all()
    return [{
        "id": pickup.id,
        "user_id": pickup.user_id,
        "items": pickup.items,
        "pickup_address": pickup.pickup_address,
        "contact_number": pickup.contact_number,
        "status": pickup.status,
        "requested_at": pickup.requested_at.isoformat(),
        "responded_at": pickup.responded_at.isoformat() if pickup.responded_at else None
    } for pickup in pickups]

@app.post("/api/item-pickups/{pickup_id}/schedule")
async def schedule_pickup(pickup_id: int, db: Session = Depends(get_db)):
    """Admin schedules/accepts a pickup"""
    try:
        pickup = db.query(ItemPickup).filter_by(id=pickup_id).first()
        if not pickup:
            raise HTTPException(status_code=404, detail="Pickup not found")
        
        pickup.status = 'scheduled'
        pickup.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Pickup scheduled"})
    except Exception as e:
        logger.error(f"Error scheduling pickup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/item-pickups/{pickup_id}/reject")
async def reject_pickup(pickup_id: int, db: Session = Depends(get_db)):
    """Admin rejects a pickup"""
    try:
        pickup = db.query(ItemPickup).filter_by(id=pickup_id).first()
        if not pickup:
            raise HTTPException(status_code=404, detail="Pickup not found")
        
        pickup.status = 'rejected'
        pickup.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Pickup rejected"})
    except Exception as e:
        logger.error(f"Error rejecting pickup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ VOLUNTEER REQUEST ENDPOINTS ============

@app.post("/api/volunteer-requests")
async def create_volunteer_request(data: dict, db: Session = Depends(get_db)):
    """User registers as volunteer"""
    try:
        volunteer_name = data.get("volunteer_name", "")
        volunteer_email = data.get("volunteer_email", "")
        volunteer_phone = data.get("volunteer_phone", "")
        areas_of_interest = data.get("areas_of_interest", "")
        duration_months = data.get("duration_months", 1)
        user_id = data.get("user_id", 1)
        
        if not volunteer_name:
            raise HTTPException(status_code=400, detail="Name is required")
        
        volunteer = VolunteerRequest(
            user_id=user_id,
            volunteer_name=volunteer_name,
            volunteer_email=volunteer_email,
            volunteer_phone=volunteer_phone,
            areas_of_interest=areas_of_interest,
            duration_months=duration_months,
            status='pending'
        )
        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)
        
        return JSONResponse({
            "message": "Volunteer request submitted successfully",
            "volunteer_id": volunteer.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating volunteer request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteer-requests")
async def get_volunteer_requests(status: str = None, db: Session = Depends(get_db)):
    """Get all volunteer requests"""
    query = db.query(VolunteerRequest)
    if status:
        query = query.filter_by(status=status)
    
    volunteers = query.order_by(VolunteerRequest.requested_at.desc()).all()
    return [{
        "id": volunteer.id,
        "user_id": volunteer.user_id,
        "volunteer_name": volunteer.volunteer_name,
        "volunteer_email": volunteer.volunteer_email,
        "volunteer_phone": volunteer.volunteer_phone,
        "areas_of_interest": volunteer.areas_of_interest,
        "duration_months": volunteer.duration_months,
        "status": volunteer.status,
        "requested_at": volunteer.requested_at.isoformat(),
        "responded_at": volunteer.responded_at.isoformat() if volunteer.responded_at else None
    } for volunteer in volunteers]

@app.post("/api/volunteer-requests/{volunteer_id}/accept")
async def accept_volunteer(volunteer_id: int, data: dict, db: Session = Depends(get_db)):
    """Admin accepts a volunteer for specific duration"""
    try:
        volunteer = db.query(VolunteerRequest).filter_by(id=volunteer_id).first()
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer request not found")
        
        # Optionally update duration if provided
        if "duration_months" in data:
            volunteer.duration_months = data["duration_months"]
        
        volunteer.status = 'accepted'
        volunteer.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Volunteer accepted"})
    except Exception as e:
        logger.error(f"Error accepting volunteer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/volunteer-requests/{volunteer_id}/reject")
async def reject_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Admin rejects a volunteer"""
    try:
        volunteer = db.query(VolunteerRequest).filter_by(id=volunteer_id).first()
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer request not found")
        
        volunteer.status = 'rejected'
        volunteer.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Volunteer rejected"})
    except Exception as e:
        logger.error(f"Error rejecting volunteer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ DAMAGE REPORT ENDPOINTS ============

@app.post("/api/damage-reports")
async def create_damage_report(data: dict, db: Session = Depends(get_db)):
    """User submits damage report"""
    try:
        logger.info(f"Received damage report data: {data}")
        user_id = data.get("user_id", 1)
        property_type = data.get("property_type", "")
        damage_level = data.get("damage_level", "")
        estimated_loss = data.get("estimated_loss", 0)
        description = data.get("description", "")
        
        if not property_type or not damage_level or estimated_loss <= 0:
            logger.error(f"Validation failed: property_type={property_type}, damage_level={damage_level}, estimated_loss={estimated_loss}")
            raise HTTPException(status_code=400, detail="All fields are required")
        
        report = DamageReport(
            user_id=user_id,
            property_type=property_type,
            damage_level=damage_level,
            estimated_loss=float(estimated_loss),
            description=description,
            status='pending'
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"Damage report created successfully with ID: {report.id}")
        return JSONResponse({
            "message": "Damage report submitted successfully",
            "report_id": report.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating damage report: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/damage-reports")
async def get_damage_reports(status: str = None, db: Session = Depends(get_db)):
    """Get all damage reports"""
    query = db.query(DamageReport)
    if status:
        query = query.filter_by(status=status)
    
    reports = query.order_by(DamageReport.submitted_at.desc()).all()
    return [{
        "id": report.id,
        "user_id": report.user_id,
        "user_name": report.user.name if report.user else "Unknown",
        "property_type": report.property_type,
        "damage_level": report.damage_level,
        "estimated_loss": report.estimated_loss,
        "description": report.description,
        "status": report.status,
        "submitted_at": report.submitted_at.isoformat(),
        "responded_at": report.responded_at.isoformat() if report.responded_at else None
    } for report in reports]

@app.post("/api/damage-reports/{report_id}/approve")
async def approve_damage_report(report_id: int, db: Session = Depends(get_db)):
    """Admin approves damage report"""
    try:
        report = db.query(DamageReport).filter_by(id=report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.status = 'approved'
        report.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Damage report approved"})
    except Exception as e:
        logger.error(f"Error approving report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/damage-reports/{report_id}/reject")
async def reject_damage_report(report_id: int, db: Session = Depends(get_db)):
    """Admin rejects damage report"""
    try:
        report = db.query(DamageReport).filter_by(id=report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.status = 'rejected'
        report.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Damage report rejected"})
    except Exception as e:
        logger.error(f"Error rejecting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ FINANCIAL AID ENDPOINTS ============

@app.post("/api/financial-aid")
async def create_financial_aid(data: dict, db: Session = Depends(get_db)):
    """User applies for financial aid"""
    try:
        logger.info(f"Received financial aid data: {data}")
        user_id = data.get("user_id", 1)
        aid_type = data.get("aid_type", "")
        amount_requested = data.get("amount_requested", 0)
        purpose = data.get("purpose", "")
        
        if not aid_type or amount_requested <= 0:
            logger.error(f"Validation failed: aid_type={aid_type}, amount_requested={amount_requested}")
            raise HTTPException(status_code=400, detail="Aid type and amount are required")
        
        aid = FinancialAid(
            user_id=user_id,
            aid_type=aid_type,
            amount_requested=float(amount_requested),
            purpose=purpose,
            status='pending'
        )
        db.add(aid)
        db.commit()
        db.refresh(aid)
        
        logger.info(f"Financial aid created successfully with ID: {aid.id}")
        return JSONResponse({
            "message": "Financial aid request submitted successfully",
            "aid_id": aid.id
        }, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating financial aid: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/financial-aid")
async def get_financial_aid(status: str = None, db: Session = Depends(get_db)):
    """Get all financial aid requests"""
    query = db.query(FinancialAid)
    if status:
        query = query.filter_by(status=status)
    
    aids = query.order_by(FinancialAid.requested_at.desc()).all()
    return [{
        "id": aid.id,
        "user_id": aid.user_id,
        "user_name": aid.user.name if aid.user else "Unknown",
        "aid_type": aid.aid_type,
        "amount_requested": aid.amount_requested,
        "purpose": aid.purpose,
        "status": aid.status,
        "approved_amount": aid.approved_amount,
        "requested_at": aid.requested_at.isoformat(),
        "responded_at": aid.responded_at.isoformat() if aid.responded_at else None
    } for aid in aids]

@app.post("/api/financial-aid/{aid_id}/approve")
async def approve_financial_aid(aid_id: int, data: dict, db: Session = Depends(get_db)):
    """Admin approves financial aid"""
    try:
        aid = db.query(FinancialAid).filter_by(id=aid_id).first()
        if not aid:
            raise HTTPException(status_code=404, detail="Aid request not found")
        
        approved_amount = data.get("approved_amount", aid.amount_requested)
        aid.status = 'approved'
        aid.approved_amount = approved_amount
        aid.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Financial aid approved"})
    except Exception as e:
        logger.error(f"Error approving aid: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/financial-aid/{aid_id}/reject")
async def reject_financial_aid(aid_id: int, db: Session = Depends(get_db)):
    """Admin rejects financial aid"""
    try:
        aid = db.query(FinancialAid).filter_by(id=aid_id).first()
        if not aid:
            raise HTTPException(status_code=404, detail="Aid request not found")
        
        aid.status = 'rejected'
        aid.responded_at = datetime.utcnow()
        db.commit()
        
        return JSONResponse({"message": "Financial aid rejected"})
    except Exception as e:
        logger.error(f"Error rejecting aid: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)