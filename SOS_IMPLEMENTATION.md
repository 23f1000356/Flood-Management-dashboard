# SOS Emergency Feature Implementation

## Overview
Implemented an end-to-end SOS emergency alert system that allows users to send emergency flood alerts from the User Dashboard, which are then displayed in red on the Admin Dashboard with a resolve button.

## Changes Made

### 1. Backend (`backend.py`)
- **Added resolve endpoint**: `POST /api/alerts/{alert_id}/resolve`
  - Marks an alert as acknowledged
  - Returns updated alert data
  - Emits socket event for real-time updates

### 2. User Dashboard (`pages/UserDashboard.js`)
- **Added state variables**:
  - `sosSending`: Tracks if SOS is being sent
  - `lastSOS`: Stores last SOS send result

- **Added `sendSOS()` function**:
  - Attempts to get user's geolocation using browser API
  - Creates alert message with coordinates (if available)
  - Posts to `/api/alerts/send` with `risk: 'high'`
  - Shows success/failure alert to user

- **Updated SOS section UI**:
  - Dynamic "SEND SOS" button that calls `sendSOS()`
  - Shows "Sending..." state while processing
  - Displays last SOS status (sent/failed)
  - Includes emergency contact numbers

### 3. Admin Dashboard (`pages/admin.js`)
- **Updated `populateAlerts()` function**:
  - Fetches alerts from `/api/alerts` API
  - Filters out acknowledged alerts
  - Maps backend data to UI format

- **Added `resolveAlert()` function**:
  - Calls `/api/alerts/{id}/resolve` endpoint
  - Refreshes alert list after resolution
  - Shows notification on success/failure

- **Enhanced alert display**:
  - SOS alerts (type='error') displayed with:
    - Red background (#fee)
    - Red left border (4px solid #f00)
    - Bold red title text (#d00)
  - Added "Resolve" button for each alert
  - Button styled in green (#10b981)

## User Flow

### Sending SOS (User Side)
1. User clicks "SOS Emergency" in sidebar
2. User clicks "🚨 SEND SOS" button
3. Browser requests location permission (optional)
4. System sends alert to backend with:
   - Title: "SOS Emergency"
   - Message: "SOS Emergency - Flood situation. Location: [lat], [lng]"
   - Risk: "high" (displays as type='error')
5. User sees confirmation alert

### Receiving SOS (Admin Side)
1. Admin dashboard polls `/api/alerts` every 5 seconds
2. New SOS alerts appear in red in "Live System Alerts" section
3. Alert shows:
   - 🚨 icon
   - Bold red title
   - Message with location
   - Timestamp
   - Green "Resolve" button
4. Admin clicks "Resolve" to acknowledge
5. Alert is marked as resolved and removed from view

## API Endpoints Used

### User Dashboard
- `POST /api/alerts/send` - Send new SOS alert
  ```json
  {
    "title": "SOS Emergency",
    "message": "SOS Emergency - Flood situation. Location: 19.0760, 72.8777",
    "risk": "high"
  }
  ```

### Admin Dashboard
- `GET /api/alerts` - Fetch all alerts
- `POST /api/alerts/{alert_id}/resolve` - Mark alert as acknowledged

## Testing

1. **Start backend**: `python backend.py` (port 8000)
2. **Start frontend**: `npm run dev` (port 3000)
3. **Test SOS flow**:
   - Login as user → Navigate to "SOS Emergency"
   - Click "SEND SOS" → Allow location access
   - Login as admin → Check "Live System Alerts"
   - Verify red SOS alert appears
   - Click "Resolve" → Alert disappears

## Features
- ✅ Real-time geolocation capture
- ✅ Graceful fallback if location unavailable
- ✅ High-priority alert (red styling)
- ✅ Admin resolve functionality
- ✅ Auto-refresh alerts every 5 seconds
- ✅ Success/failure feedback
- ✅ Emergency contact numbers displayed

## Future Enhancements
- WebSocket for real-time push notifications
- Sound/visual alert on admin dashboard for new SOS
- Map view showing SOS location
- SMS/email notifications to emergency contacts
- SOS history tracking
