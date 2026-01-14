# 🔧 TROUBLESHOOTING: Recovery & Compensation System

## ❌ Issue: "Failed to submit damage report" / "Failed to submit financial aid request"

### 🎯 Solution Steps (Follow in Order):

### Step 1: Restart Backend Server ⭐ MOST IMPORTANT
The new database tables need to be created!

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
python backend.py
```

**What this does:**
- Runs `init_db()` which creates all database tables
- Creates the new `damage_reports` and `financial_aid` tables
- Without this, the tables don't exist and submissions will fail!

### Step 2: Verify Backend is Running
Check the terminal where backend is running. You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Starting up and loading models...
```

### Step 3: Test API Endpoints
Run the test script:
```bash
python test_recovery_api.py
```

**Expected Output:**
```
✅ Damage report submitted successfully!
✅ Successfully retrieved damage reports!
✅ Financial aid request submitted successfully!
✅ Successfully retrieved financial aid requests!
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try submitting a form
4. Look for error messages

**Common Errors:**

**Error: "Failed to fetch"**
- ❌ Backend is not running
- ✅ Solution: Start backend with `python backend.py`

**Error: "CORS policy"**
- ❌ CORS not configured
- ✅ Solution: Backend already has CORS enabled, restart backend

**Error: "404 Not Found"**
- ❌ Endpoint doesn't exist
- ✅ Solution: Restart backend to register new endpoints

**Error: "500 Internal Server Error"**
- ❌ Database table doesn't exist
- ✅ Solution: Restart backend to create tables

**Error: "All fields are required"**
- ❌ Form fields are empty
- ✅ Solution: Fill all required fields before submitting

### Step 5: Check Backend Logs
Look at the backend terminal for detailed error messages:

**Good logs (working):**
```
INFO: Received damage report data: {'user_id': 1, 'property_type': 'House', ...}
INFO: Damage report created successfully with ID: 1
```

**Bad logs (error):**
```
ERROR: Error creating damage report: no such table: damage_reports
```
- ✅ Solution: Restart backend to create tables

### Step 6: Verify Database Tables
After restarting backend, check if tables exist:

```python
# Run in Python console
from backend import SessionLocal, DamageReport, FinancialAid
db = SessionLocal()
print("Damage Reports:", db.query(DamageReport).count())
print("Financial Aid:", db.query(FinancialAid).count())
```

### Step 7: Test from User Dashboard
1. Go to Recovery section
2. Fill Damage Assessment form:
   - Property Type: Select any option
   - Damage Level: Select any option
   - Estimated Loss: Enter number (e.g., 50000)
   - Description: Optional
3. Click "Submit Damage Report"
4. Check browser console for detailed error

### Step 8: Test Financial Aid
1. In Recovery section, scroll to "Apply for Financial Aid"
2. Choose any card (Government Relief / Insurance / Business Loan)
3. Enter amount (e.g., 30000)
4. Click Apply/File Claim
5. Check browser console for detailed error

## 📊 Verification Checklist

- [ ] Backend server is running (check terminal)
- [ ] Backend shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] Database tables created (restart backend if not)
- [ ] Browser console shows no CORS errors
- [ ] Test script passes all tests
- [ ] Forms have all required fields filled
- [ ] Network tab shows 201 status code (success)

## 🔍 Advanced Debugging

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Submit form
4. Look for request to `/api/damage-reports` or `/api/financial-aid`
5. Click on the request
6. Check:
   - **Status**: Should be 201 (Created)
   - **Request Payload**: Should show your data
   - **Response**: Should show success message

### Common Status Codes
- **201**: ✅ Success (Created)
- **400**: ❌ Bad Request (validation failed)
- **404**: ❌ Not Found (endpoint doesn't exist)
- **500**: ❌ Server Error (database issue)

### Manual API Test (using curl)
```bash
# Test Damage Report
curl -X POST http://localhost:8000/api/damage-reports \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"property_type":"House","damage_level":"Major (50-75%)","estimated_loss":50000,"description":"Test"}'

# Test Financial Aid
curl -X POST http://localhost:8000/api/financial-aid \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"aid_type":"Government Relief Fund","amount_requested":30000,"purpose":"Test"}'
```

## ✅ Success Indicators

**When everything works:**
1. ✅ Alert shows "Damage report submitted successfully!"
2. ✅ Alert shows "Financial aid request submitted successfully!"
3. ✅ Browser console shows: `Response: {message: "...", id: 1}`
4. ✅ Backend logs show: `INFO: Damage report created successfully with ID: 1`
5. ✅ Admin dashboard shows the new report/request

## 🚨 Still Not Working?

If you've tried all steps above and it still doesn't work:

1. **Check backend.py line numbers:**
   - DamageReport model: ~line 276
   - FinancialAid model: ~line 289
   - POST /api/damage-reports: ~line 2332
   - POST /api/financial-aid: ~line 2428

2. **Verify imports:**
   - Check if `DamageReport` and `FinancialAid` are imported
   - Check if they're in `Base.metadata`

3. **Delete database and restart:**
   ```bash
   # Delete flood_management.db
   # Restart backend - it will recreate everything
   python backend.py
   ```

4. **Check error message in alert:**
   - The new error handling shows detailed messages
   - Look for specific error text in the alert

## 📝 Quick Fix Summary

**90% of issues are fixed by:**
```bash
# Stop backend (Ctrl+C)
# Restart backend
python backend.py
```

**This creates the database tables needed for the new features!**
