import requests
import json

BASE_URL = "http://localhost:8000"

print("Testing Recovery & Compensation API Endpoints\n")
print("=" * 50)

# Test 1: Submit Damage Report
print("\n1. Testing Damage Report Submission...")
damage_data = {
    "user_id": 1,
    "property_type": "House",
    "damage_level": "Major (50-75%)",
    "estimated_loss": 50000,
    "description": "Test damage report"
}

try:
    response = requests.post(f"{BASE_URL}/api/damage-reports", json=damage_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    if response.status_code == 201:
        print("✅ Damage report submitted successfully!")
    else:
        print("❌ Failed to submit damage report")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Get Damage Reports
print("\n2. Testing Get Damage Reports...")
try:
    response = requests.get(f"{BASE_URL}/api/damage-reports")
    print(f"Status Code: {response.status_code}")
    reports = response.json()
    print(f"Number of reports: {len(reports)}")
    if reports:
        print(f"Latest report: {reports[0]}")
        print("✅ Successfully retrieved damage reports!")
    else:
        print("⚠️ No damage reports found")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Submit Financial Aid Request
print("\n3. Testing Financial Aid Submission...")
aid_data = {
    "user_id": 1,
    "aid_type": "Government Relief Fund",
    "amount_requested": 30000,
    "purpose": "Government Relief Fund request"
}

try:
    response = requests.post(f"{BASE_URL}/api/financial-aid", json=aid_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    if response.status_code == 201:
        print("✅ Financial aid request submitted successfully!")
    else:
        print("❌ Failed to submit financial aid request")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Get Financial Aid Requests
print("\n4. Testing Get Financial Aid Requests...")
try:
    response = requests.get(f"{BASE_URL}/api/financial-aid")
    print(f"Status Code: {response.status_code}")
    aids = response.json()
    print(f"Number of aid requests: {len(aids)}")
    if aids:
        print(f"Latest request: {aids[0]}")
        print("✅ Successfully retrieved financial aid requests!")
    else:
        print("⚠️ No financial aid requests found")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 50)
print("Testing Complete!")
