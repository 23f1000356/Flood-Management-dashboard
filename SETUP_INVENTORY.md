# Setup Guide - Initialize Inventory

## Quick Start

### 1. Start Backend
```bash
cd "c:\Users\royvi\Desktop\Flood major project"
python backend.py
```

### 2. Initialize Sample Inventory

Use these curl commands or Postman to add initial inventory:

```bash
# Water Bottles
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Water Bottles\", \"quantity\": 1000, \"unit\": \"bottles\"}"

# Food Packets
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Food Packets\", \"quantity\": 500, \"unit\": \"packets\"}"

# Medicine Kits
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Medicine Kits\", \"quantity\": 200, \"unit\": \"kits\"}"

# First Aid Kits
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"First Aid Kits\", \"quantity\": 150, \"unit\": \"kits\"}"

# Blankets
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Blankets\", \"quantity\": 300, \"unit\": \"pieces\"}"

# Tents
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Tents\", \"quantity\": 50, \"unit\": \"units\"}"

# Rescue Boats
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Rescue Boats\", \"quantity\": 10, \"unit\": \"boats\"}"

# Life Jackets
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"resource_name\": \"Life Jackets\", \"quantity\": 250, \"unit\": \"jackets\"}"
```

### 3. Verify Inventory

```bash
curl http://localhost:8000/api/inventory
```

## Using Python Script

Create a file `init_inventory.py`:

```python
import requests

BASE_URL = "http://localhost:8000"

inventory_items = [
    {"resource_name": "Water Bottles", "quantity": 1000, "unit": "bottles"},
    {"resource_name": "Food Packets", "quantity": 500, "unit": "packets"},
    {"resource_name": "Medicine Kits", "quantity": 200, "unit": "kits"},
    {"resource_name": "First Aid Kits", "quantity": 150, "unit": "kits"},
    {"resource_name": "Blankets", "quantity": 300, "unit": "pieces"},
    {"resource_name": "Tents", "quantity": 50, "unit": "units"},
    {"resource_name": "Rescue Boats", "quantity": 10, "unit": "boats"},
    {"resource_name": "Life Jackets", "quantity": 250, "unit": "jackets"},
]

for item in inventory_items:
    response = requests.post(f"{BASE_URL}/api/inventory", json=item)
    print(f"Added {item['resource_name']}: {response.json()}")

print("\n✅ Inventory initialized successfully!")
```

Run it:
```bash
python init_inventory.py
```

## Using Postman

1. Open Postman
2. Create a new POST request to `http://localhost:8000/api/inventory`
3. Set Headers: `Content-Type: application/json`
4. Set Body (raw JSON):
```json
{
  "resource_name": "Water Bottles",
  "quantity": 1000,
  "unit": "bottles"
}
```
5. Click Send
6. Repeat for other items

## Testing the System

### Test User Request Flow

1. **Start Frontend**:
   ```bash
   npm run dev
   ```

2. **Login as User**:
   - Go to `http://localhost:3000/UserDashboard`
   - Click "Resources" in sidebar

3. **Submit Request**:
   - Enter quantity (e.g., 5) for Water Bottles
   - Click "Request"
   - Check "My Requests" section

4. **Login as Admin**:
   - Go to `http://localhost:3000/admin`
   - Username: `admin`
   - Password: `admin123`

5. **Approve Request**:
   - Click "Resource Allocation" in sidebar
   - Scroll to "Resource Requests from Users"
   - Click "✓ Approve" on the request

6. **Verify**:
   - Check inventory decreased by 5
   - Go back to User Dashboard
   - See request status changed to "APPROVED"

## Database Location

The SQLite database is created at:
```
c:\Users\royvi\Desktop\Flood major project\acms.db
```

You can view it using:
- DB Browser for SQLite
- SQLite CLI: `sqlite3 acms.db`

## Troubleshooting

### Backend not starting?
```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-multipart pillow psutil xgboost scikit-learn tensorflow joblib pandas numpy python-socketio
```

### Database locked?
```bash
# Stop backend and delete database
rm acms.db
# Restart backend (will recreate database)
python backend.py
```

### Inventory not showing?
1. Check backend is running on port 8000
2. Check browser console for errors
3. Verify API endpoint: `http://localhost:8000/api/inventory`

## Quick Commands Reference

```bash
# View all inventory
curl http://localhost:8000/api/inventory

# View all requests
curl http://localhost:8000/api/resource-requests

# View pending requests only
curl http://localhost:8000/api/resource-requests?status=pending

# Approve request (replace {id} with actual request ID)
curl -X POST http://localhost:8000/api/resource-requests/{id}/approve

# Reject request
curl -X POST http://localhost:8000/api/resource-requests/{id}/reject
```

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

These are created automatically when backend starts!
