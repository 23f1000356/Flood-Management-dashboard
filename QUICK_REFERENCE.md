# Quick Reference Card

## 🚀 Start the System

```bash
# Terminal 1 - Backend
cd "c:\Users\royvi\Desktop\Flood major project"
python backend.py

# Terminal 2 - Frontend
npm run dev
```

## 🔑 Login Credentials

**Admin**:
- URL: `http://localhost:3000/admin`
- Username: `admin`
- Password: `admin123`

**User**:
- URL: `http://localhost:3000/UserDashboard`
- Any registered user

## 📍 Key URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| User Dashboard | http://localhost:3000/UserDashboard |
| Admin Dashboard | http://localhost:3000/admin |

## 🎯 Feature Locations

### User Dashboard

| Feature | Location | Action |
|---------|----------|--------|
| **Send SOS** | Sidebar → SOS Emergency | Click "🚨 SEND SOS" button |
| **View Resources** | Sidebar → Resources | See inventory, request items |
| **Track Requests** | Resources → My Requests | View status (PENDING/APPROVED/REJECTED) |
| **Find Shelters** | Sidebar → Shelters | Click "Get Directions" |
| **View Alerts** | Sidebar → Live Alerts | See all system alerts |

### Admin Dashboard

| Feature | Location | Action |
|---------|----------|--------|
| **View SOS Alerts** | Dashboard → Live System Alerts | See RED alerts, click "Resolve" |
| **Manage Inventory** | Sidebar → Resource Allocation | View stock levels |
| **Handle Requests** | Resource Allocation → Resource Requests | Click "✓ Approve" or "✗ Reject" |
| **View Users** | Sidebar → User Management | See all registered users |

## 🔧 Common Tasks

### Initialize Inventory (First Time)

```bash
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"resource_name": "Water Bottles", "quantity": 1000, "unit": "bottles"}'
```

Repeat for: Food Packets, Medicine Kits, First Aid Kits, Blankets, Tents, etc.

### Test SOS Flow

1. User Dashboard → SOS Emergency
2. Click "SEND SOS" (allow location)
3. Admin Dashboard → See RED alert
4. Click "Resolve"
5. Alert disappears

### Test Resource Request Flow

1. **User**: Resources → Enter quantity → Click "Request"
2. **Admin**: Resource Allocation → Resource Requests → Click "✓ Approve"
3. **User**: Check "My Requests" → See "APPROVED" badge

## 📊 API Quick Reference

### Alerts
```bash
# List alerts
GET http://localhost:8000/api/alerts

# Send SOS
POST http://localhost:8000/api/alerts/send
Body: {"title": "SOS Emergency", "message": "...", "risk": "high"}

# Resolve alert
POST http://localhost:8000/api/alerts/{id}/resolve
```

### Inventory
```bash
# Get inventory
GET http://localhost:8000/api/inventory

# Add/update inventory
POST http://localhost:8000/api/inventory
Body: {"resource_name": "Water", "quantity": 100, "unit": "bottles"}
```

### Resource Requests
```bash
# Create request
POST http://localhost:8000/api/resource-requests
Body: {"user_id": 1, "resource_name": "Water", "quantity": 5}

# List requests
GET http://localhost:8000/api/resource-requests?status=pending

# Approve request
POST http://localhost:8000/api/resource-requests/{id}/approve

# Reject request
POST http://localhost:8000/api/resource-requests/{id}/reject
```

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 APPROVED | Green (#10b981) | Request fulfilled |
| 🔴 REJECTED | Red (#ef4444) | Request denied |
| 🟡 PENDING | Yellow (#f59e0b) | Awaiting admin action |
| 🔴 SOS ALERT | Red (#dc2626) | Emergency alert |

## 🐛 Troubleshooting

### Backend won't start
```bash
pip install fastapi uvicorn sqlalchemy pydantic python-socketio
```

### Frontend won't start
```bash
npm install
npm run dev
```

### Database issues
```bash
# Delete and recreate
rm acms.db
python backend.py
```

### Inventory not showing
1. Check backend is running: `http://localhost:8000/api/inventory`
2. Initialize inventory (see above)
3. Check browser console for errors

### Requests not appearing
1. Verify backend is running
2. Check network tab in browser dev tools
3. Ensure user_id is valid

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend.py` | Backend API server |
| `pages/UserDashboard.js` | User interface |
| `pages/admin.js` | Admin interface |
| `acms.db` | SQLite database |
| `IMPLEMENTATION_SUMMARY.md` | Complete feature list |
| `RESOURCE_MANAGEMENT_SYSTEM.md` | Detailed documentation |

## 🔄 Auto-Refresh Intervals

| Component | Interval | What Updates |
|-----------|----------|--------------|
| User Alerts | 5 seconds | Live alerts |
| User Requests | 10 seconds | Request status |
| Admin Alerts | 5 seconds | SOS alerts |

## 💡 Pro Tips

1. **SOS Location**: Allow browser location access for GPS coordinates
2. **Request Tracking**: Requests auto-refresh every 10 seconds
3. **Instant Feedback**: UI updates immediately, even before backend confirms
4. **Google Maps**: Opens in new tab, doesn't navigate away
5. **Admin Resolve**: Click once to remove alert instantly
6. **Inventory Check**: Approval fails if insufficient stock

## 📞 Emergency Numbers (Displayed in App)

- Police: 100
- Fire Brigade: 101
- Ambulance: 102
- Disaster Helpline: 1078

## 🎯 Testing Checklist

- [ ] Backend starts successfully
- [ ] Frontend loads without errors
- [ ] Can login as admin
- [ ] Can access user dashboard
- [ ] SOS button sends alert
- [ ] SOS appears in red on admin dashboard
- [ ] Resolve button removes alert
- [ ] Inventory displays on user dashboard
- [ ] Can submit resource request
- [ ] Request appears on admin dashboard
- [ ] Approve button works
- [ ] Inventory decreases after approval
- [ ] User sees APPROVED status
- [ ] Reject button works
- [ ] User sees REJECTED status
- [ ] Google Maps opens from shelter

## 📚 Documentation Files

1. `IMPLEMENTATION_SUMMARY.md` - Overview of all features
2. `RESOURCE_MANAGEMENT_SYSTEM.md` - Complete system docs
3. `SYSTEM_ARCHITECTURE.md` - Architecture diagrams
4. `SOS_IMPLEMENTATION.md` - SOS feature details
5. `SHELTER_MAPS_INTEGRATION.md` - Google Maps integration
6. `SETUP_INVENTORY.md` - Inventory setup guide
7. `QUICK_REFERENCE.md` - This file

## 🎉 Quick Demo Script

**5-Minute Demo**:

1. Start backend and frontend
2. Login as user → Send SOS
3. Login as admin → See RED alert → Resolve
4. User dashboard → Request 5 Water Bottles
5. Admin dashboard → Approve request
6. User dashboard → See APPROVED status
7. User dashboard → Click "Get Directions" on shelter
8. Google Maps opens with location

**Done!** ✅

---

**Need Help?** Check the documentation files or review backend logs!
