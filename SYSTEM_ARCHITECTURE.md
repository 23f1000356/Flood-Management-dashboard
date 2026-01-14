# System Architecture - Complete Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLOOD MANAGEMENT SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   USER DASHBOARD     │         │   ADMIN DASHBOARD    │
│   (Next.js/React)    │         │   (Next.js/React)    │
│                      │         │                      │
│  • Live Alerts       │         │  • System Overview   │
│  • SOS Emergency ────┼────────▶│  • SOS Alerts (RED)  │
│  • Shelters + Maps   │         │  • Resolve Alerts    │
│  • Resources View    │         │  • Resource Mgmt     │
│  • Request Items ────┼────────▶│  • Approve/Reject    │
│  • Track Status      │         │  • Inventory Mgmt    │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           │         HTTP/REST API          │
           └────────────┬───────────────────┘
                        │
           ┌────────────▼────────────┐
           │   BACKEND (FastAPI)     │
           │   Port: 8000            │
           │                         │
           │  API Endpoints:         │
           │  • /api/alerts          │
           │  • /api/inventory       │
           │  • /api/resource-req... │
           │  • /api/floods          │
           │  • /api/users           │
           └────────────┬────────────┘
                        │
           ┌────────────▼────────────┐
           │   DATABASE (SQLite)     │
           │   acms.db               │
           │                         │
           │  Tables:                │
           │  • users                │
           │  • alerts               │
           │  • inventory            │
           │  • resource_requests    │
           │  • disasters            │
           │  • flood_predictions    │
           └─────────────────────────┘
```

## Feature Flow Diagrams

### 1. SOS Emergency System

```
┌─────────────┐
│    USER     │
│  Dashboard  │
└──────┬──────┘
       │ 1. Clicks "SEND SOS"
       │
       ▼
┌─────────────────────────┐
│  Browser Geolocation    │
│  Gets GPS coordinates   │
└──────┬──────────────────┘
       │ 2. Location: 19.0760, 72.8777
       │
       ▼
┌─────────────────────────────────────────────┐
│  POST /api/alerts/send                      │
│  {                                          │
│    "title": "SOS Emergency",                │
│    "message": "Flood situation. Lat: ...",  │
│    "risk": "high"                           │
│  }                                          │
└──────┬──────────────────────────────────────┘
       │ 3. Creates Alert record
       │
       ▼
┌─────────────────────────┐
│  Database: alerts       │
│  type: 'error' (high)   │
│  acknowledged: false    │
└──────┬──────────────────┘
       │ 4. Stored
       │
       ▼
┌─────────────────────────┐
│   ADMIN Dashboard       │
│   Polls every 5s        │
└──────┬──────────────────┘
       │ 5. GET /api/alerts
       │
       ▼
┌─────────────────────────────────────┐
│  Displays in RED                    │
│  • Background: #dc2626              │
│  • Title: "SOS Emergency"           │
│  • Message with location            │
│  • [Resolve] button                 │
└──────┬──────────────────────────────┘
       │ 6. Admin clicks "Resolve"
       │
       ▼
┌─────────────────────────────────────┐
│  POST /api/alerts/{id}/resolve      │
│  Sets acknowledged = true           │
└──────┬──────────────────────────────┘
       │ 7. Alert marked resolved
       │
       ▼
┌─────────────────────────┐
│  Alert removed from UI  │
│  (instant feedback)     │
└─────────────────────────┘
```

### 2. Resource Management System

```
┌─────────────┐
│    USER     │
│  Dashboard  │
└──────┬──────┘
       │ 1. Views Resources section
       │
       ▼
┌─────────────────────────┐
│  GET /api/inventory     │
│  Returns available items│
└──────┬──────────────────┘
       │ 2. Shows inventory
       │
       ▼
┌───────────────────────────────────┐
│  Available Resources Grid         │
│  • Water Bottles: 1000            │
│  • Food Packets: 500              │
│  • Medicine Kits: 200             │
│  [Input: Quantity] [Request]      │
└──────┬────────────────────────────┘
       │ 3. User enters 5, clicks Request
       │
       ▼
┌─────────────────────────────────────┐
│  POST /api/resource-requests        │
│  {                                  │
│    "user_id": 1,                    │
│    "resource_name": "Water Bottles",│
│    "quantity": 5                    │
│  }                                  │
└──────┬──────────────────────────────┘
       │ 4. Creates request record
       │
       ▼
┌─────────────────────────┐
│  Database:              │
│  resource_requests      │
│  status: 'pending'      │
└──────┬──────────────────┘
       │ 5. Stored
       │
       ▼
┌─────────────────────────┐
│   ADMIN Dashboard       │
│   Resource Allocation   │
└──────┬──────────────────┘
       │ 6. GET /api/resource-requests?status=pending
       │
       ▼
┌───────────────────────────────────────┐
│  Resource Requests from Users         │
│  ┌─────────────────────────────────┐  │
│  │ John Doe                        │  │
│  │ Water Bottles - Qty: 5          │  │
│  │ [✓ Approve] [✗ Reject]          │  │
│  └─────────────────────────────────┘  │
└──────┬────────────────────────────────┘
       │ 7. Admin clicks "✓ Approve"
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/resource-requests/1/approve  │
│                                         │
│  Logic:                                 │
│  1. Check inventory: 1000 bottles       │
│  2. Sufficient? Yes                     │
│  3. Deduct: 1000 - 5 = 995             │
│  4. Update request: status='approved'   │
└──────┬──────────────────────────────────┘
       │ 8. Database updated
       │
       ├──────────────────┬─────────────────┐
       ▼                  ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ Inventory   │  │ Request      │  │ User sees   │
│ Updated:    │  │ Status:      │  │ "APPROVED"  │
│ 995 bottles │  │ 'approved'   │  │ badge       │
└─────────────┘  └──────────────┘  └─────────────┘
```

### 3. Google Maps Integration

```
┌─────────────┐
│    USER     │
│  Dashboard  │
└──────┬──────┘
       │ 1. Navigates to Shelters
       │
       ▼
┌─────────────────────────────────────┐
│  Available Shelters                 │
│  ┌───────────────────────────────┐  │
│  │ Community Center A            │  │
│  │ 📍 2.3 km away                │  │
│  │ 45 beds available             │  │
│  │ [Get Directions]              │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │ 2. Clicks "Get Directions"
       │
       ▼
┌─────────────────────────────────────────────┐
│  window.open(                               │
│    'https://www.google.com/maps/search/    │
│     ?api=1&query=Community+Center+A+Mumbai' │
│  )                                          │
└──────┬──────────────────────────────────────┘
       │ 3. Opens in new tab
       │
       ▼
┌─────────────────────────┐
│   Google Maps           │
│   • Shows location      │
│   • Get directions      │
│   • Navigation options  │
└─────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │◀─────────┐
│ name         │          │
│ username     │          │
│ email        │          │
│ role         │          │
└──────────────┘          │
                          │
                          │ user_id (FK)
                          │
                  ┌───────┴──────────┐
                  │ resource_requests│
                  │──────────────────│
                  │ id (PK)          │
                  │ user_id (FK)     │
                  │ resource_name    │
                  │ quantity         │
                  │ status           │
                  │ requested_at     │
                  │ responded_at     │
                  └──────────────────┘

┌──────────────┐
│  inventory   │
│──────────────│
│ id (PK)      │
│ resource_name│ ◀─── Referenced by resource_requests
│ quantity     │      (no FK, just name matching)
│ unit         │
│ last_updated │
└──────────────┘

┌──────────────┐
│   alerts     │
│──────────────│
│ alert_id (PK)│
│ disaster_id  │
│ type         │ ◀─── 'error' for SOS
│ title        │
│ message      │
│ time         │
│ acknowledged │ ◀─── false = pending, true = resolved
└──────────────┘

┌──────────────┐
│  disasters   │
│──────────────│
│ disaster_id  │
│ name         │
│ location     │
│ severity     │
│ status       │
└──────────────┘
```

## API Endpoint Map

```
Backend (FastAPI) - http://localhost:8000

Authentication & Users
├─ POST   /api/login
├─ POST   /api/signup
├─ GET    /api/users
└─ GET    /api/users/count

Alerts & SOS
├─ GET    /api/alerts
├─ POST   /api/alerts/send
└─ POST   /api/alerts/{id}/resolve

Inventory Management
├─ GET    /api/inventory
└─ POST   /api/inventory

Resource Requests
├─ POST   /api/resource-requests
├─ GET    /api/resource-requests?status={status}
├─ POST   /api/resource-requests/{id}/approve
└─ POST   /api/resource-requests/{id}/reject

Disasters & Predictions
├─ GET    /api/floods
├─ POST   /api/predict-flood
├─ GET    /api/flood-predictions/history
└─ GET    /api/system-status
```

## Component Hierarchy

```
Frontend Structure

User Dashboard (UserDashboard.js)
├─ Navigation Bar
├─ Sidebar
│  ├─ Live Alerts
│  ├─ User Profile
│  ├─ Interactive Map
│  ├─ SOS Emergency ◀─── NEW
│  ├─ Shelters ◀─── Enhanced with Maps
│  ├─ Resources ◀─── NEW (Dynamic)
│  ├─ Community
│  ├─ Helpline
│  ├─ Education
│  ├─ Donation
│  └─ Recovery
└─ Main Content Area
   ├─ Dashboard (default)
   ├─ Alerts Section
   ├─ SOS Section ◀─── NEW
   │  ├─ Send SOS Button
   │  ├─ Location Sharing
   │  └─ Emergency Contacts
   ├─ Resources Section ◀─── NEW
   │  ├─ Available Resources Grid
   │  │  └─ Resource Cards (with Request button)
   │  └─ My Requests List
   │     └─ Request Items (with status badges)
   └─ Other Sections...

Admin Dashboard (admin.js)
├─ Navigation Bar
├─ Sidebar
│  ├─ Dashboard
│  ├─ AI Agents
│  ├─ Active Disasters
│  ├─ Real-time Monitor
│  ├─ Resource Allocation ◀─── Enhanced
│  ├─ Evacuation Plans
│  ├─ User Management
│  ├─ Issues & Support
│  ├─ Analytics
│  └─ System Settings
└─ Main Content Area
   ├─ System Overview
   │  └─ Live System Alerts ◀─── Enhanced (RED SOS)
   ├─ Resource Allocation Section ◀─── Enhanced
   │  ├─ Inventory Display
   │  ├─ Distribution & Assignment
   │  ├─ Logistics & Tracking
   │  └─ Resource Requests ◀─── NEW (Dynamic)
   │     └─ Request Cards (with Approve/Reject)
   └─ Other Sections...
```

## State Management

```
User Dashboard State
├─ user: User data
├─ alerts: Alert[] (from API)
├─ sosSending: boolean ◀─── NEW
├─ lastSOS: {ok, data} ◀─── NEW
├─ inventory: Inventory[] ◀─── NEW
├─ myRequests: Request[] ◀─── NEW
└─ activeSection: string

Admin Dashboard State
├─ alerts: Alert[] (from API) ◀─── Enhanced
├─ resourceRequests: Request[] ◀─── NEW
├─ inventory: Inventory[] ◀─── NEW
├─ floods: Flood[]
├─ users: User[]
├─ systemStatus: SystemStatus
└─ currentSection: string
```

## Technology Stack

```
┌─────────────────────────────────────┐
│          FRONTEND                   │
│  • Next.js (React framework)        │
│  • React Hooks (useState, useEffect)│
│  • Lucide Icons                     │
│  • CSS Modules                      │
│  • Google Charts (Maps)             │
└─────────────────────────────────────┘
                 │
                 │ HTTP/REST
                 │
┌─────────────────────────────────────┐
│          BACKEND                    │
│  • FastAPI (Python)                 │
│  • Pydantic (Validation)            │
│  • SQLAlchemy (ORM)                 │
│  • Python SocketIO                  │
│  • Uvicorn (ASGI server)            │
└─────────────────────────────────────┘
                 │
                 │ SQL
                 │
┌─────────────────────────────────────┐
│          DATABASE                   │
│  • SQLite                           │
│  • File: acms.db                    │
└─────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌──────────────────────────────────────────────┐
│              PRODUCTION                      │
└──────────────────────────────────────────────┘

Frontend (Vercel/Netlify)
├─ Next.js Static Export
├─ CDN Distribution
└─ HTTPS

Backend (AWS/Heroku/DigitalOcean)
├─ FastAPI on Gunicorn/Uvicorn
├─ NGINX Reverse Proxy
├─ SSL Certificate
└─ Environment Variables

Database (PostgreSQL/MySQL)
├─ Managed Database Service
├─ Automated Backups
└─ Connection Pooling

External Services
├─ Google Maps API
├─ SMS Gateway (Twilio)
├─ Email Service (SendGrid)
└─ Push Notifications (Firebase)
```

## Security Layers

```
┌─────────────────────────────────────┐
│     Authentication Layer            │
│  • Login required for all features  │
│  • Role-based access (user/admin)   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│     Authorization Layer             │
│  • Admin-only endpoints protected   │
│  • User can only see own requests   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│     Validation Layer                │
│  • Pydantic models validate input   │
│  • Frontend validates before submit │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│     Database Layer                  │
│  • Foreign key constraints          │
│  • Unique constraints               │
│  • NOT NULL constraints             │
└─────────────────────────────────────┘
```

## Performance Optimizations

```
Frontend
├─ Auto-refresh intervals
│  ├─ Alerts: 5 seconds
│  └─ Requests: 10 seconds
├─ Instant UI updates (optimistic)
├─ Lazy loading sections
└─ Memoized components

Backend
├─ Database connection pooling
├─ Query optimization
├─ Indexed columns
└─ Async/await for I/O

Database
├─ Indexed primary keys
├─ Foreign key indexes
└─ Query result caching
```

This architecture provides a robust, scalable foundation for the flood management system! 🏗️
