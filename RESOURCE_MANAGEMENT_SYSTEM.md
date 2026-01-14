# Resource Management System - Complete Implementation

## Overview
Implemented a full-featured resource management system that allows:
- **Admin**: Manage inventory and approve/reject user resource requests
- **Users**: View available resources and submit requests
- **Real-time sync**: Inventory updates when requests are approved

## System Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  User Dashboard │────────▶│   Backend    │◀────────│ Admin Dashboard │
│                 │         │   FastAPI    │         │                 │
│ - View Inventory│         │              │         │ - Manage Stock  │
│ - Request Items │         │  Database    │         │ - Approve/Reject│
│ - Track Status  │         │  SQLite      │         │ - View Requests │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Database Models

### 1. **Inventory Table**
```python
class Inventory(Base):
    id: int (Primary Key)
    resource_name: str (Unique)
    quantity: int
    unit: str (optional)
    last_updated: datetime
```

### 2. **ResourceRequest Table**
```python
class ResourceRequest(Base):
    id: int (Primary Key)
    user_id: int (Foreign Key → users.id)
    resource_name: str
    quantity: int
    status: str ('pending', 'approved', 'rejected')
    requested_at: datetime
    responded_at: datetime (nullable)
    notes: str (optional)
```

## Backend API Endpoints

### Inventory Management

#### `GET /api/inventory`
- **Description**: Get all inventory items
- **Response**:
```json
[
  {
    "id": 1,
    "resource_name": "Water Bottles",
    "quantity": 1000,
    "unit": "bottles",
    "last_updated": "2025-10-01T10:00:00"
  }
]
```

#### `POST /api/inventory`
- **Description**: Add or update inventory item
- **Request Body**:
```json
{
  "resource_name": "Food Packets",
  "quantity": 500,
  "unit": "packets"
}
```
- **Response**: `{"message": "Inventory added/updated", "id": 1}`

### Resource Requests

#### `POST /api/resource-requests`
- **Description**: User creates a resource request
- **Request Body**:
```json
{
  "user_id": 1,
  "resource_name": "Water Bottles",
  "quantity": 10,
  "notes": "Urgent need"
}
```
- **Response**: `{"message": "Resource request created", "request_id": 1}`

#### `GET /api/resource-requests?status=pending`
- **Description**: Get resource requests (optionally filtered by status)
- **Response**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "user_name": "John Doe",
    "resource_name": "Water Bottles",
    "quantity": 10,
    "status": "pending",
    "requested_at": "2025-10-01T10:00:00",
    "responded_at": null,
    "notes": "Urgent need"
  }
]
```

#### `POST /api/resource-requests/{request_id}/approve`
- **Description**: Admin approves a request
- **Logic**:
  1. Check if inventory has sufficient quantity
  2. Deduct quantity from inventory
  3. Update request status to 'approved'
  4. Set responded_at timestamp
- **Response**: `{"message": "Request approved"}`
- **Error**: `{"detail": "Insufficient inventory"}` (400)

#### `POST /api/resource-requests/{request_id}/reject`
- **Description**: Admin rejects a request
- **Logic**:
  1. Update request status to 'rejected'
  2. Set responded_at timestamp
- **Response**: `{"message": "Request rejected"}`

## Frontend Implementation

### User Dashboard (`UserDashboard.js`)

#### State Management
```javascript
const [inventory, setInventory] = useState([]);
const [myRequests, setMyRequests] = useState([]);
```

#### Functions
- `fetchInventory()`: Fetches available resources from backend
- `fetchMyRequests()`: Fetches user's request history
- `requestResource(resourceName, quantity)`: Submits new resource request

#### UI Features
1. **Available Resources Grid**
   - Shows all inventory items with current quantities
   - Input field for quantity
   - "Request" button for each resource

2. **My Requests Section**
   - Lists all user's requests
   - Shows status with color coding:
     - 🟢 Green: Approved
     - 🔴 Red: Rejected
     - 🟡 Yellow: Pending
   - Displays timestamp

#### Resources Section Rendering
```javascript
activeSection === 'resources'
  ? createElement('div', { className: userStyles.sectionContent },
      // Available Resources Grid
      createElement('h3', null, '📦 Available Resources'),
      inventory.map(item => /* Resource card with request button */),
      
      // My Requests List
      createElement('h3', null, '📋 My Requests'),
      myRequests.map(req => /* Request item with status badge */)
    )
```

### Admin Dashboard (`admin.js`)

#### State Management
```javascript
const [resourceRequests, setResourceRequests] = useState([]);
const [inventory, setInventory] = useState([]);
```

#### Functions
- `fetchResourceRequests()`: Fetches pending requests
- `fetchInventory()`: Fetches current inventory
- `approveRequest(requestId)`: Approves request and updates inventory
- `rejectRequest(requestId)`: Rejects request

#### UI Features
1. **Inventory Display**
   - Shows current stock levels
   - Grid layout with resource names and quantities

2. **Resource Requests Section**
   - Title: "Resource Requests from Users"
   - Shows pending requests with:
     - User name
     - Resource name
     - Quantity requested
     - Request timestamp
   - Action buttons:
     - ✓ Approve (Green)
     - ✗ Reject (Red)

3. **Real-time Updates**
   - Fetches requests on component mount
   - Auto-refreshes after approve/reject actions

## User Flow

### Requesting Resources (User Side)

1. User navigates to "Resources" section
2. Views available inventory with quantities
3. Enters desired quantity in input field
4. Clicks "Request" button
5. System validates quantity > 0
6. Request is submitted to backend
7. User sees confirmation alert
8. Request appears in "My Requests" with "PENDING" status

### Managing Requests (Admin Side)

1. Admin navigates to "Resource Allocation" section
2. Scrolls to "Resource Requests from Users"
3. Views pending requests with user details
4. **To Approve**:
   - Clicks "✓ Approve" button
   - System checks inventory availability
   - If sufficient: Deducts from inventory, marks as approved
   - If insufficient: Shows error notification
   - Request disappears from pending list
5. **To Reject**:
   - Clicks "✗ Reject" button
   - Request is marked as rejected
   - Request disappears from pending list

### Viewing Request Status (User Side)

1. User checks "My Requests" section
2. Sees status badges:
   - **PENDING** (🟡 Yellow): Awaiting admin action
   - **APPROVED** (🟢 Green): Request fulfilled
   - **REJECTED** (🔴 Red): Request denied
3. Timestamp shows when request was made

## Data Flow Example

### Scenario: User Requests 5 Water Bottles

```
1. User Dashboard
   ├─ User enters "5" in Water Bottles quantity field
   ├─ Clicks "Request"
   └─ POST /api/resource-requests
       {
         "user_id": 1,
         "resource_name": "Water Bottles",
         "quantity": 5
       }

2. Backend
   ├─ Creates ResourceRequest record
   ├─ Status: "pending"
   └─ Returns request_id: 123

3. Admin Dashboard
   ├─ Fetches GET /api/resource-requests?status=pending
   ├─ Displays: "John Doe requested 5 Water Bottles"
   └─ Admin clicks "✓ Approve"

4. Backend (Approval)
   ├─ POST /api/resource-requests/123/approve
   ├─ Checks inventory: Water Bottles = 1000
   ├─ Sufficient? Yes
   ├─ Updates inventory: 1000 - 5 = 995
   ├─ Updates request: status = "approved"
   └─ Returns success

5. User Dashboard (Refresh)
   ├─ Fetches GET /api/resource-requests
   └─ Shows: "Water Bottles - 5" with "APPROVED" badge
```

## Styling & UI

### User Dashboard Resources Section
- **Grid Layout**: Responsive, auto-fill columns
- **Resource Cards**:
  - Dark background (#1e293b)
  - Green resource name (#10b981)
  - Large quantity display (24px, bold)
  - Input field with dark theme
  - Green request button

- **Request Items**:
  - Flex layout with space-between
  - Status badges with color coding
  - Timestamp in small, muted text

### Admin Dashboard Requests Section
- **Request Cards**:
  - Light green background (rgba(16,185,129,0.05))
  - Grid layout: User | Resource | Qty | Actions
  - Bold user name with timestamp below
  - Action buttons:
    - Approve: Green (#10b981)
    - Reject: Red (#ef4444)

## Auto-Refresh & Polling

### User Dashboard
```javascript
useEffect(() => {
  fetchInventory();
  fetchMyRequests();
  const interval = setInterval(fetchMyRequests, 10000); // Every 10s
  return () => clearInterval(interval);
}, []);
```

### Admin Dashboard
```javascript
useEffect(() => {
  fetchResourceRequests();
  fetchInventory();
}, []);
```

## Error Handling

### Insufficient Inventory
```javascript
// Backend returns 400 error
{ "detail": "Insufficient inventory" }

// Admin sees notification
showNotification('Insufficient inventory', 'error');
```

### Invalid Quantity
```javascript
// Frontend validation
if (!quantity || quantity <= 0) {
  alert('Please enter a valid quantity');
  return;
}
```

## Testing Checklist

### User Dashboard
- [ ] View inventory items
- [ ] Enter quantity and submit request
- [ ] See request in "My Requests" with PENDING status
- [ ] Refresh to see status updates (APPROVED/REJECTED)
- [ ] Try requesting 0 or negative quantity (should fail)

### Admin Dashboard
- [ ] View pending requests
- [ ] Approve request with sufficient inventory
- [ ] Try approving request with insufficient inventory (should fail)
- [ ] Reject request
- [ ] Verify inventory decreases after approval
- [ ] Verify request disappears after approve/reject

### Integration
- [ ] User submits request → Admin sees it immediately
- [ ] Admin approves → User sees APPROVED status
- [ ] Admin rejects → User sees REJECTED status
- [ ] Inventory updates correctly after approval

## Future Enhancements

1. **Priority Levels**: Mark urgent requests
2. **Partial Fulfillment**: Approve partial quantities
3. **Request Notes**: Allow users to add notes
4. **Admin Notes**: Add reason for rejection
5. **Notifications**: Real-time push notifications via WebSocket
6. **Request History**: View all requests (not just pending)
7. **Inventory Alerts**: Notify admin when stock is low
8. **Batch Operations**: Approve/reject multiple requests at once
9. **Request Expiry**: Auto-reject old requests
10. **Delivery Tracking**: Track when approved items are delivered

## File Structure

```
Flood major project/
├── backend.py
│   ├── Inventory model
│   ├── ResourceRequest model
│   └── API endpoints
├── pages/
│   ├── UserDashboard.js
│   │   ├── fetchInventory()
│   │   ├── fetchMyRequests()
│   │   ├── requestResource()
│   │   └── Resources section UI
│   └── admin.js
│       ├── fetchResourceRequests()
│       ├── fetchInventory()
│       ├── approveRequest()
│       ├── rejectRequest()
│       └── Resource Requests UI
└── acms.db (SQLite database)
```

## Summary

The resource management system provides a complete workflow for disaster relief resource allocation:
- **Users** can see what's available and request what they need
- **Admins** can manage inventory and respond to requests
- **System** automatically updates inventory when requests are approved
- **Real-time** status updates keep everyone informed

This creates an efficient, transparent system for managing critical resources during flood emergencies! 🚨📦✅
