# Donation & Volunteer Management System - Implementation Guide

## ✅ Backend Complete

### Database Models Created

1. **Donation** - Tracks monetary donations
2. **ItemPickup** - Tracks item donation pickups  
3. **VolunteerRequest** - Tracks volunteer registrations

### API Endpoints (18 total)

#### Donations (6 endpoints)
- `POST /api/donations` - User submits donation
- `GET /api/donations` - List all donations
- `GET /api/donations?status=pending` - Filter by status
- `POST /api/donations/{id}/accept` - Admin accepts
- `POST /api/donations/{id}/reject` - Admin rejects

#### Item Pickups (6 endpoints)
- `POST /api/item-pickups` - User schedules pickup
- `GET /api/item-pickups` - List all pickups
- `GET /api/item-pickups?status=pending` - Filter by status
- `POST /api/item-pickups/{id}/schedule` - Admin schedules
- `POST /api/item-pickups/{id}/reject` - Admin rejects

#### Volunteer Requests (6 endpoints)
- `POST /api/volunteer-requests` - User registers as volunteer
- `GET /api/volunteer-requests` - List all requests
- `GET /api/volunteer-requests?status=pending` - Filter by status
- `POST /api/volunteer-requests/{id}/accept` - Admin accepts (with duration)
- `POST /api/volunteer-requests/{id}/reject` - Admin rejects

## 🎯 Next Steps - Frontend Implementation

### User Dashboard Updates Needed

Update the "Donation" section in `UserDashboard.js` to:

1. **Make Donation** - Connect form to API
2. **Schedule Pickup** - Connect form to API  
3. **Register as Volunteer** - Connect form to API

### Admin Dashboard Updates Needed

Add new "Funding & Volunteers" section in `admin.js` with 3 tabs:

1. **Donations Tab**
   - Show all pending donations
   - Accept/Reject buttons
   - Display: Amount, Donor Name, Email, Date

2. **Item Pickups Tab**
   - Show all pending pickups
   - Schedule/Reject buttons
   - Display: Items, Address, Contact, Date

3. **Volunteer Requests Tab**
   - Show all pending requests
   - Accept (with duration selector: 1/2/6 months) / Reject
   - Display: Name, Email, Phone, Areas of Interest, Date

## 📊 Data Flow

```
USER submits donation/pickup/volunteer request
    ↓
Saved to database with status='pending'
    ↓
ADMIN sees in "Funding & Volunteers" section
    ↓
ADMIN accepts/rejects
    ↓
Status updated in database
    ↓
USER can see status (future enhancement)
```

## 🔧 Implementation Priority

1. ✅ Backend API endpoints (DONE)
2. ⏳ User Dashboard - Connect forms to API
3. ⏳ Admin Dashboard - Create "Funding & Volunteers" section
4. ⏳ Add status tracking for users

Ready to implement the frontend next!
