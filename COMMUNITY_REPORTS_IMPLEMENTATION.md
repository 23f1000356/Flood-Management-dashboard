# Community Reports System - Complete Implementation

## ✅ Implementation Summary

Successfully implemented a complete community reporting system where users can submit reports about flood-related issues, and admins can view, investigate, and resolve them.

## System Flow

```
USER submits report
    ↓
Saved to database
    ↓
ADMIN sees in "Issues & Support"
    ↓
ADMIN can: Investigate → Resolve
    ↓
Status updates visible to all users
```

## Backend Implementation

### Database Model

**Table**: `community_reports`
```sql
CREATE TABLE community_reports (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    report_type VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    location VARCHAR(200),
    status VARCHAR(50) DEFAULT 'open',
    reported_at DATETIME NOT NULL,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### API Endpoints

#### 1. Submit Report
```
POST /api/community-reports
Body: {
  "user_id": 1,
  "report_type": "Blocked Road",
  "description": "Tree fallen, blocking entire road",
  "location": "Main Street"
}
Response: {"message": "Report submitted successfully", "report_id": 1}
```

#### 2. Get All Reports
```
GET /api/community-reports?status=open
Response: [
  {
    "id": 1,
    "user_id": 1,
    "user_name": "John Doe",
    "report_type": "Blocked Road",
    "description": "Tree fallen, blocking entire road",
    "location": "Main Street",
    "status": "open",
    "reported_at": "2025-10-01T10:30:00",
    "resolved_at": null
  }
]
```

#### 3. Mark as Investigating
```
POST /api/community-reports/{report_id}/investigate
Response: {"message": "Report marked as investigating"}
```

#### 4. Resolve Report
```
POST /api/community-reports/{report_id}/resolve
Response: {"message": "Report resolved"}
```

## User Dashboard Implementation

### Features

1. **Submit Report Form**
   - Dropdown for report type:
     - Blocked Road
     - Damaged Bridge
     - Flood Hotspot
     - Rescue Needed
     - Other
   - Textarea for description
   - Submit button

2. **Recent Community Reports**
   - Shows latest 5 reports from all users
   - Displays: Type, User, Description, Timestamp
   - Auto-refreshes every 15 seconds

### State Management
```javascript
const [communityReports, setCommunityReports] = useState([]);
```

### Functions
```javascript
fetchCommunityReports()  // Fetch all reports
submitCommunityReport(type, description)  // Submit new report
```

### UI Components
- **Report Form**: Dark theme with styled inputs
- **Report Cards**: Green left border, dark background
- **Submit Button**: Green (#10b981) with hover effect

## Admin Dashboard Implementation

### Features

1. **Community Reports Display**
   - Location: "Issues & Support" section
   - Shows all reports with full details
   - Search functionality
   - Filter by status: All, Open, Investigating, Resolved

2. **Report Management**
   - **Open Reports**: Red tinted background
   - **Investigate Button**: Orange (#ffa726) - marks as investigating
   - **Resolve Button**: Green (#10b981) - marks as resolved
   - **Status Badges**: Color-coded (Red/Orange/Green)

3. **Report Details**
   - Report Type
   - User Name
   - Description
   - Status (with color badge)
   - Timestamp
   - Action buttons

### State Management
```javascript
const [communityReports, setCommunityReports] = useState([]);
const [issueFilter, setIssueFilter] = useState('open');
const [issueSearch, setIssueSearch] = useState('');
```

### Functions
```javascript
fetchCommunityReports()  // Fetch all reports
investigateReport(reportId)  // Mark as investigating
resolveReport(reportId)  // Mark as resolved
```

### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│ Community Reports (5)                              📋   │
├─────────────────────────────────────────────────────────┤
│ [Search...]                    [Filter: Open ▼]        │
├─────────────────────────────────────────────────────────┤
│ Type        │ Status     │ Details    │ Actions        │
├─────────────────────────────────────────────────────────┤
│ Blocked Road│ [OPEN]     │ Tree...    │ [Investigate]  │
│ By: John    │ 10:30 AM   │            │ [Resolve]      │
├─────────────────────────────────────────────────────────┤
│ Flood Spot  │ [INVEST.]  │ Water...   │ [Resolve]      │
│ By: Jane    │ 10:45 AM   │            │                │
└─────────────────────────────────────────────────────────┘
```

## Report Status Flow

### Status Transitions

```
OPEN (Red)
  ↓ [Investigate Button]
INVESTIGATING (Orange)
  ↓ [Resolve Button]
RESOLVED (Green)
```

### Status Colors

| Status | Background | Text Color | Badge |
|--------|-----------|------------|-------|
| **OPEN** | `rgba(255,107,107,0.05)` | `#ff6b6b` | Red |
| **INVESTIGATING** | Transparent | `#ffa726` | Orange |
| **RESOLVED** | Transparent | `#10b981` | Green |

## Report Types

1. **Blocked Road** - Road obstructions
2. **Damaged Bridge** - Bridge damage
3. **Flood Hotspot** - Areas with flooding
4. **Rescue Needed** - Emergency rescue requests
5. **Other** - Miscellaneous reports

## Testing Guide

### Step 1: Submit Report (User)

1. Open User Dashboard: `http://localhost:3000/UserDashboard`
2. Click "Community" in sidebar
3. Select report type: "Blocked Road"
4. Enter description: "Tree fallen, blocking entire road"
5. Click "Submit Report"
6. ✅ See success alert
7. ✅ Report appears in "Recent Community Reports"

### Step 2: View Report (Admin)

1. Open Admin Dashboard: `http://localhost:3000/admin`
2. Click "Issues & Support" in sidebar
3. ✅ See report with:
   - Type: "Blocked Road"
   - User: "John Doe"
   - Description: "Tree fallen, blocking entire road"
   - Status: "OPEN" (red badge)
   - Red tinted background
   - Two buttons: "Investigate" and "Resolve"

### Step 3: Investigate Report (Admin)

1. Click "Investigate" button
2. ✅ Status changes to "INVESTIGATING" (orange badge)
3. ✅ Background returns to normal
4. ✅ "Investigate" button disappears
5. ✅ "Resolve" button remains

### Step 4: Resolve Report (Admin)

1. Click "Resolve" button
2. ✅ Status changes to "RESOLVED" (green badge)
3. ✅ Both action buttons disappear
4. ✅ Report can be filtered out using "Open" filter

### Step 5: Filter Reports (Admin)

1. Use filter dropdown:
   - **All**: Shows all reports
   - **Open**: Shows only open reports
   - **Investigating**: Shows reports being investigated
   - **Resolved**: Shows resolved reports

### Step 6: Search Reports (Admin)

1. Type in search box: "blocked"
2. ✅ Only matching reports shown
3. Searches in: Report Type and Description

## Auto-Refresh

- **User Dashboard**: Refreshes every 15 seconds
- **Admin Dashboard**: Manual refresh (can add auto-refresh if needed)

## Data Validation

### Frontend
- Report type must be selected (not "Select Report Type")
- Description cannot be empty
- Shows alert if validation fails

### Backend
- Description is required (400 error if missing)
- User ID defaults to 1 if not provided
- Report type defaults to "Other" if not provided

## Database Queries

### View All Reports
```sql
SELECT * FROM community_reports ORDER BY reported_at DESC;
```

### View Open Reports
```sql
SELECT * FROM community_reports WHERE status = 'open' ORDER BY reported_at DESC;
```

### View Reports by User
```sql
SELECT * FROM community_reports WHERE user_id = 1 ORDER BY reported_at DESC;
```

## API Testing with cURL

### Submit Report
```bash
curl -X POST http://localhost:8000/api/community-reports \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "report_type": "Blocked Road",
    "description": "Tree fallen, blocking entire road"
  }'
```

### Get All Reports
```bash
curl http://localhost:8000/api/community-reports
```

### Get Open Reports Only
```bash
curl http://localhost:8000/api/community-reports?status=open
```

### Mark as Investigating
```bash
curl -X POST http://localhost:8000/api/community-reports/1/investigate
```

### Resolve Report
```bash
curl -X POST http://localhost:8000/api/community-reports/1/resolve
```

## Features Summary

✅ **User Can**:
- Submit community reports
- Select report type from dropdown
- Enter detailed description
- View recent reports from all users
- See report timestamps

✅ **Admin Can**:
- View all community reports
- Search reports by keyword
- Filter by status (Open/Investigating/Resolved)
- Mark reports as "Investigating"
- Resolve reports
- See user who submitted each report
- View timestamps

✅ **System**:
- Stores reports in database
- Auto-refreshes data
- Color-codes status
- Validates input
- Provides instant feedback

## Files Modified

1. **`backend.py`**:
   - Added `CommunityReport` model
   - Added 4 API endpoints
   - Added status management

2. **`pages/UserDashboard.js`**:
   - Added community reports state
   - Added submit/fetch functions
   - Added dynamic Community section
   - Added auto-refresh

3. **`pages/admin.js`**:
   - Added community reports state
   - Added fetch/investigate/resolve functions
   - Replaced Issues section with Community Reports
   - Added search and filter functionality

## Success Criteria

✅ User can submit reports  
✅ Reports saved to database  
✅ Admin sees reports in Issues & Support  
✅ Admin can investigate reports  
✅ Admin can resolve reports  
✅ Status updates work correctly  
✅ Search functionality works  
✅ Filter functionality works  
✅ Color coding is correct  
✅ Auto-refresh works  

## Complete! 🎉

The community reporting system is fully functional and integrated with the flood management platform!
