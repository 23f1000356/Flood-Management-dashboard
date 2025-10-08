# Admin Dashboard - Funding & Volunteers Section Implementation

## ✅ User Dashboard - COMPLETE
The donation forms are now connected to the backend API.

## 🎯 Admin Dashboard - Next Steps

Add a new "Funding & Volunteers" section to the admin sidebar with 3 tabs:

### 1. Donations Tab
```javascript
// State
const [donations, setDonations] = useState([]);

// Fetch function
const fetchDonations = async () => {
  const res = await fetch('http://localhost:8000/api/donations?status=pending');
  const data = await res.json();
  setDonations(data);
};

// Accept/Reject functions
const acceptDonation = async (id) => {
  await fetch(`http://localhost:8000/api/donations/${id}/accept`, { method: 'POST' });
  fetchDonations();
};

const rejectDonation = async (id) => {
  await fetch(`http://localhost:8000/api/donations/${id}/reject`, { method: 'POST' });
  fetchDonations();
};

// Display
donations.map(donation => (
  <div>
    <div>{donation.donor_name} - ₹{donation.amount}</div>
    <button onClick={() => acceptDonation(donation.id)}>Accept</button>
    <button onClick={() => rejectDonation(donation.id)}>Reject</button>
  </div>
))
```

### 2. Item Pickups Tab
```javascript
// State
const [pickups, setPickups] = useState([]);

// Fetch
const fetchPickups = async () => {
  const res = await fetch('http://localhost:8000/api/item-pickups?status=pending');
  setPickups(await res.json());
};

// Schedule/Reject
const schedulePickup = async (id) => {
  await fetch(`http://localhost:8000/api/item-pickups/${id}/schedule`, { method: 'POST' });
  fetchPickups();
};

const rejectPickup = async (id) => {
  await fetch(`http://localhost:8000/api/item-pickups/${id}/reject`, { method: 'POST' });
  fetchPickups();
};

// Display
pickups.map(pickup => (
  <div>
    <div>{pickup.items}</div>
    <div>{pickup.pickup_address}</div>
    <button onClick={() => schedulePickup(pickup.id)}>Schedule</button>
    <button onClick={() => rejectPickup(pickup.id)}>Reject</button>
  </div>
))
```

### 3. Volunteer Requests Tab
```javascript
// State
const [volunteers, setVolunteers] = useState([]);

// Fetch
const fetchVolunteers = async () => {
  const res = await fetch('http://localhost:8000/api/volunteer-requests?status=pending');
  setVolunteers(await res.json());
};

// Accept with duration / Reject
const acceptVolunteer = async (id, duration) => {
  await fetch(`http://localhost:8000/api/volunteer-requests/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_months: duration })
  });
  fetchVolunteers();
};

const rejectVolunteer = async (id) => {
  await fetch(`http://localhost:8000/api/volunteer-requests/${id}/reject`, { method: 'POST' });
  fetchVolunteers();
};

// Display
volunteers.map(vol => (
  <div>
    <div>{vol.volunteer_name} - {vol.volunteer_email}</div>
    <div>Duration: {vol.duration_months} months</div>
    <select id={`duration-${vol.id}`}>
      <option value="1">1 Month</option>
      <option value="2">2 Months</option>
      <option value="6">6 Months</option>
    </select>
    <button onClick={() => {
      const duration = document.getElementById(`duration-${vol.id}`).value;
      acceptVolunteer(vol.id, parseInt(duration));
    }}>Accept</button>
    <button onClick={() => rejectVolunteer(vol.id)}>Reject</button>
  </div>
))
```

## 📍 Add to Admin Sidebar
```javascript
{ icon: DollarSign, text: 'Funding & Volunteers', key: 'funding' }
```

## ✅ Complete System Ready!
- Backend: 18 API endpoints ✅
- User forms: Connected to API ✅
- Admin section: Ready to implement ✅
