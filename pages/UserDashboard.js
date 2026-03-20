import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createElement } from 'react';
import { 
  AlertTriangle,
  Bell,
  User,
  CloudLightning,
  Truck,
  Wrench,
  Map,
  MapPin,
  LogOut,
  Phone,
  BookOpen,
  Heart,
  Shield,
  Home,
  MessageSquare,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';
import styles from './index.module.css';
import userStyles from './user.module.css';

const features = [
  {
    icon: "🧠",
    title: "Flood Prediction Agent",
    description: "LSTM Neural Network for time-series weather pattern analysis with multi-feature input processing 15 weather parameters.",
    details: ["Real-time risk assessment", "Confidence scores", "Continuous learning"],
    path: "/disaster-prediction-agent"
  },
  {
    icon: "🛰️",
    title: "Monitoring Agent",
    description: "CNN-based satellite image analysis for fire/flood detection with social media monitoring using advanced NLP.",
    details: ["Satellite imagery", "Social media tracking", "Multi-source fusion"],
    path: "/monitoring-agent"
  },
  {
    icon: "⚙️",
    title: "Resource Allocation Agent",
    description: "Reinforcement Learning (Q-learning) for optimal resource deployment with dynamic management capabilities.",
    details: ["Q-learning optimization", "Dynamic management", "Distance-based routing"],
    path: "/resource"
  },
  {
    icon: "🔧",
    title: "Recovery Support Agent",
    description: "AI-powered recovery planning with phase-based approach, cost estimation, and stakeholder communication.",
    details: ["Recovery planning", "Cost estimation", "Timeline optimization"],
    path: "/recovery"
  },
];

// IndiaRiskMap renders an India GeoChart with specified state colors
const IndiaRiskMap = () => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const draw = () => {
      if (!window.google || !window.google.visualization) return;

      const data = window.google.visualization.arrayToDataTable([
        ['State', 'Risk'],
        // 2 = Red, 1 = Yellow, 0 = Green
        ['Kerala', 2],
        ['Uttar Pradesh', 1],
        ['Assam', 0],
        ['Bihar', 0],
        ['West Bengal', 2],
        ['Odisha', 1],
      ]);

      const el = document.getElementById('india-risk-map');
      if (!el) return;

      const width = Math.max(320, el.clientWidth || 0);
      const height = 420; // explicit numeric height for Google Charts

      const options = {
        region: 'IN',
        resolution: 'provinces',
        legend: 'none',
        colorAxis: { colors: ['#10b981', '#f59e0b', '#ef4444'] }, // green, yellow, red
        backgroundColor: 'transparent',
        datalessRegionColor: '#2d3748',
        enableRegionInteractivity: false,
        width,
        height,
      };
      const chart = new window.google.visualization.GeoChart(el);
      chart.draw(data, options);

      const onResize = () => {
        const w = Math.max(320, el.clientWidth || 0);
        chart.draw(data, { ...options, width: w });
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    };

    const loadAndDraw = () => {
      window.google.charts.load('current', { packages: ['geochart'] });
      window.google.charts.setOnLoadCallback(draw);
    };

    if (!window.google || !window.google.charts) {
      const s = document.createElement('script');
      s.src = 'https://www.gstatic.com/charts/loader.js';
      s.async = true;
      s.onload = loadAndDraw;
      document.body.appendChild(s);
    } else {
      loadAndDraw();
    }
  }, []);

  return (
    <div className={userStyles.mapContainer}>
      <div id="india-risk-map" style={{ width: '100%', height: '420px' }} />
      <div className={userStyles.mapLegend} style={{ marginTop: '12px' }}>
        <div className={userStyles.legendItem}>
          <span className={userStyles.redZone}></span> Kerala, West Bengal
        </div>
        <div className={userStyles.legendItem}>
          <span className={userStyles.yellowZone}></span> Uttar Pradesh, Odisha
        </div>
        <div className={userStyles.legendItem}>
          <span className={userStyles.greenZone}></span> Assam, Bihar
        </div>
      </div>
    </div>
  );
};

const sidebarSections = {
  alerts: {
    title: "Live Flood Alerts",
    content: null
  },
  profile: {
    title: "User Profile",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>👤 Profile Information</h3>
        <div className={userStyles.profileForm}>
          <div className={userStyles.inputGroup}>
            <label>Full Name</label>
            <input type="text" defaultValue="John Doe" />
          </div>
          <div className={userStyles.inputGroup}>
            <label>Phone Number</label>
            <input type="text" defaultValue="+91 9876543210" />
          </div>
          <div className={userStyles.inputGroup}>
            <label>Emergency Contact</label>
            <input type="text" placeholder="Emergency contact number" />
          </div>
          <div className={userStyles.inputGroup}>
            <label>Address</label>
            <textarea rows="3" placeholder="Your complete address"></textarea>
          </div>
          <div className={userStyles.inputGroup}>
            <label>Medical Conditions</label>
            <input type="text" placeholder="Any medical conditions (diabetes, etc.)" />
          </div>
        </div>
        <button className={userStyles.saveBtn}>Save Profile</button>
      </div>
    )
  },

  map: {
    title: "Interactive Map & Risk Zones",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>🗺️ Flood Risk Map</h3>
        <IndiaRiskMap />
        <div className={userStyles.mapControls}>
          <button className={userStyles.mapBtn}>🏠 Show Shelters</button>
          <button className={userStyles.mapBtn}>🛣️ Evacuation Routes</button>
          <button className={userStyles.mapBtn}>📍 My Location</button>
          <button className={userStyles.mapBtn}>⚠️ Risk Areas</button>
        </div>
      </div>
    )
  },

  sos: {
    title: "SOS & Emergency Assistance",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>🆘 Emergency Assistance</h3>
        <div className={userStyles.emergencySection}>
          <button className={userStyles.sosBtn}>🚨 SEND SOS</button>
          <p className={userStyles.sosText}>Press for immediate rescue assistance</p>
        </div>

        <div className={userStyles.locationSection}>
          <h4>📍 Location Sharing</h4>
          <button className={userStyles.shareLocationBtn}>Share Live Location</button>
          <p>Your location: Lat: 19.0760, Lng: 72.8777</p>
        </div>

        <div className={userStyles.emergencyContacts}>
          <h4>📞 Emergency Numbers</h4>
          <div className={userStyles.contactGrid}>
            <div className={userStyles.contactCard}>
              <strong>Police</strong>
              <a href="tel:100">100</a>
            </div>
            <div className={userStyles.contactCard}>
              <strong>Fire Brigade</strong>
              <a href="tel:101">101</a>
            </div>
            <div className={userStyles.contactCard}>
              <strong>Ambulance</strong>
              <a href="tel:102">102</a>
            </div>
            <div className={userStyles.contactCard}>
              <strong>Disaster Helpline</strong>
              <a href="tel:1078">1078</a>
            </div>
          </div>
        </div>
      </div>
    )
  },

  shelters: {
    title: "Shelter & Relief Center Finder",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>🏠 Available Shelters</h3>
        <div className={userStyles.shelterList}>
          <div className={userStyles.shelterCard}>
            <h4>Community Center A</h4>
            <p>📍 2.3 km away</p>
            <div className={userStyles.shelterCapacity}>
              <span className={userStyles.available}>45 beds available</span>
              <span>Food: ✅</span>
              <span>Medical: ✅</span>
            </div>
            <button 
              className={userStyles.directionsBtn}
              onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Community+Center+A+Mumbai', '_blank')}
            >
              Get Directions
            </button>
          </div>

          <div className={userStyles.shelterCard}>
            <h4>School Shelter B</h4>
            <p>📍 3.7 km away</p>
            <div className={userStyles.shelterCapacity}>
              <span className={userStyles.limited}>12 beds left</span>
              <span>Food: ✅</span>
              <span>Medical: ❌</span>
            </div>
            <button 
              className={userStyles.directionsBtn}
              onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=School+Shelter+B+Mumbai', '_blank')}
            >
              Get Directions
            </button>
          </div>

          <div className={userStyles.shelterCard}>
            <h4>Temple Shelter C</h4>
            <p>📍 5.1 km away</p>
            <div className={userStyles.shelterCapacity}>
              <span className={userStyles.full}>Full</span>
              <span>Food: ✅</span>
              <span>Medical: ✅</span>
            </div>
            <button className={userStyles.directionsBtn} disabled>Full</button>
          </div>
        </div>
      </div>
    )
  },

  resources: {
    title: "Resource & Aid Request",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>📦 Request Resources</h3>
        <div className={userStyles.resourceForm}>
          <div className={userStyles.resourceGrid}>
            <div className={userStyles.resourceCard}>
              <h4>💧 Water</h4>
              <input type="number" placeholder="Bottles needed" />
              <button className={userStyles.requestBtn}>Request</button>
            </div>
            <div className={userStyles.resourceCard}>
              <h4>🍞 Food</h4>
              <input type="number" placeholder="Meals needed" />
              <button className={userStyles.requestBtn}>Request</button>
            </div>
            <div className={userStyles.resourceCard}>
              <h4>💊 Medicine</h4>
              <input type="text" placeholder="Medicine name" />
              <button className={userStyles.requestBtn}>Request</button>
            </div>
            <div className={userStyles.resourceCard}>
              <h4>🩹 First Aid</h4>
              <textarea placeholder="Specify requirements"></textarea>
              <button className={userStyles.requestBtn}>Request</button>
            </div>
          </div>
        </div>

        <div className={userStyles.requestHistory}>
          <h4>📋 My Requests</h4>
          <div className={userStyles.requestItem}>
            <span>Water - 5 bottles</span>
            <span className={userStyles.statusPending}>Pending</span>
          </div>
          <div className={userStyles.requestItem}>
            <span>Insulin</span>
            <span className={userStyles.statusApproved}>Approved - Arriving in 2 hours</span>
          </div>
        </div>
      </div>
    )
  },

  community: {
    title: "Community Reporting",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>👥 Community Reports</h3>
        <div className={userStyles.reportForm}>
          <h4>📝 Submit Report</h4>
          <select className={userStyles.reportType}>
            <option>Select Report Type</option>
            <option>Blocked Road</option>
            <option>Damaged Bridge</option>
            <option>Flood Hotspot</option>
            <option>Rescue Needed</option>
            <option>Other</option>
          </select>
          <textarea placeholder="Describe the situation..." rows="4"></textarea>
          <div className={userStyles.uploadSection}>
            <input type="file" accept="image/*,video/*" />
            <label>📸 Upload Photo/Video Evidence</label>
          </div>
          <button className={userStyles.submitReportBtn}>Submit Report</button>
        </div>

        <div className={userStyles.communityReports}>
          <h4>🌍 Recent Community Reports</h4>
          <div className={userStyles.reportItem}>
            <strong>Road Block - Main Street</strong>
            <p>Tree fallen, blocking entire road</p>
            <span className={userStyles.reportTime}>30 minutes ago</span>
          </div>
          <div className={userStyles.reportItem}>
            <strong>Flood Spot - Park Area</strong>
            <p>Water level 3 feet, avoid area</p>
            <span className={userStyles.reportTime}>1 hour ago</span>
          </div>
        </div>
      </div>
    )
  },

  helpline: {
    title: "Helpline & Communication",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>📞 24/7 Helpline</h3>
        <div className={userStyles.helplineSection}>
          <div className={userStyles.chatBot}>
            <h4>🤖 AI Assistant</h4>
            <div className={userStyles.chatContainer}>
              <div className={userStyles.chatMessage}>
                <strong>Bot:</strong> How can I help you with flood safety?
              </div>
              <div className={userStyles.chatMessage}>
                <strong>You:</strong> What should I pack in emergency kit?
              </div>
              <div className={userStyles.chatMessage}>
                <strong>Bot:</strong> Essential items include: water (1 gallon per person per day), non-perishable food, flashlight, batteries, first aid kit, medications, important documents in waterproof container.
              </div>
            </div>
            <div className={userStyles.chatInput}>
              <input type="text" placeholder="Ask me anything about flood safety..." />
              <button>Send</button>
            </div>
          </div>

          <div className={userStyles.quickActions}>
            <h4>⚡ Quick Help</h4>
            <button className={userStyles.quickBtn}>What to do before flood?</button>
            <button className={userStyles.quickBtn}>How to purify water?</button>
            <button className={userStyles.quickBtn}>Safe evacuation tips</button>
            <button className={userStyles.quickBtn}>Post-flood recovery</button>
          </div>
        </div>
      </div>
    )
  },

  education: {
    title: "Education & Awareness",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>📚 Flood Safety Education</h3>
        <div className={userStyles.educationTabs}>
          <div className={userStyles.educationCard}>
            <h4>🎒 Emergency Preparedness</h4>
            <ul>
              <li>Create family emergency plan</li>
              <li>Prepare emergency kit with 72-hour supplies</li>
              <li>Identify evacuation routes</li>
              <li>Keep important documents safe</li>
            </ul>
          </div>

          <div className={userStyles.educationCard}>
            <h4>⚡ During Flood</h4>
            <ul>
              <li>Move to higher ground immediately</li>
              <li>Avoid walking/driving through flood water</li>
              <li>Stay away from electrical lines</li>
              <li>Listen to emergency broadcasts</li>
            </ul>
          </div>

          <div className={userStyles.educationCard}>
            <h4>🔧 After Flood</h4>
            <ul>
              <li>Wait for authorities to declare area safe</li>
              <li>Document damage with photos</li>
              <li>Boil water before drinking</li>
              <li>Disinfect everything that got wet</li>
            </ul>
          </div>

          <div className={userStyles.educationCard}>
            <h4>💡 Safety Tips</h4>
            <ul>
              <li>6 inches of water can knock you down</li>
              <li>12 inches can carry away vehicles</li>
              <li>Turn around, don't drown</li>
              <li>Stay informed through official sources</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },

  donation: {
    title: "Donation & Volunteering",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>❤️ Support Relief Efforts</h3>
        <div className={userStyles.supportTabs}>
          <div className={userStyles.donationSection}>
            <h4>💰 Make a Donation</h4>
            <div className={userStyles.donationAmounts}>
              <button className={userStyles.amountBtn}>₹500</button>
              <button className={userStyles.amountBtn}>₹1000</button>
              <button className={userStyles.amountBtn}>₹2000</button>
              <button className={userStyles.amountBtn}>₹5000</button>
            </div>
            <input type="number" placeholder="Custom amount" />
            <button className={userStyles.donateBtn}>Donate Now</button>
          </div>

          <div className={userStyles.itemDonation}>
            <h4>📦 Donate Items</h4>
            <div className={userStyles.itemCheckboxes}>
              <label><input type="checkbox" /> Water Bottles</label>
              <label><input type="checkbox" /> Food Packets</label>
              <label><input type="checkbox" /> Clothes</label>
              <label><input type="checkbox" /> Blankets</label>
              <label><input type="checkbox" /> Medicines</label>
              <label><input type="checkbox" /> Toiletries</label>
            </div>
            <textarea placeholder="Specify quantities and pickup address"></textarea>
            <button className={userStyles.donateBtn}>Schedule Pickup</button>
          </div>

          <div className={userStyles.volunteerSection}>
            <h4>🙋‍♂️ Volunteer Registration</h4>
            <div className={userStyles.volunteerOptions}>
              <label><input type="checkbox" /> Rescue Operations</label>
              <label><input type="checkbox" /> Relief Distribution</label>
              <label><input type="checkbox" /> Medical Assistance</label>
              <label><input type="checkbox" /> Shelter Management</label>
            </div>
            <button className={userStyles.volunteerBtn}>Register as Volunteer</button>
          </div>
        </div>
      </div>
    )
  },

  recovery: {
    title: "Post-Flood Recovery",
    content: (
      <div className={userStyles.sectionContent}>
        <h3>🏗️ Recovery & Compensation</h3>
        <div className={userStyles.recoveryTabs}>
          <div className={userStyles.damageReport}>
            <h4>📋 Damage Assessment</h4>
            <form className={userStyles.damageForm}>
              <div className={userStyles.inputGroup}>
                <label>Property Type</label>
                <select>
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Commercial</option>
                  <option>Vehicle</option>
                  <option>Agricultural Land</option>
                </select>
              </div>
              <div className={userStyles.inputGroup}>
                <label>Damage Level</label>
                <select>
                  <option>Minor ( 25%)</option>
                  <option>Moderate (25-50%)</option>
                  <option>Major (50-75%)</option>
                  <option>Severe ( 75%)</option>
                </select>
              </div>
              <div className={userStyles.inputGroup}>
                <label>Estimated Loss Amount</label>
                <input type="number" placeholder="Amount in ₹" />
              </div>
              <div className={userStyles.inputGroup}>
                <label>Upload Damage Photos</label>
                <input type="file" multiple accept="image/*" />
              </div>
              <button className={userStyles.submitBtn}>Submit Damage Report</button>
            </form>
          </div>

          <div className={userStyles.compensationSection}>
            <h4>💰 Apply for Financial Aid</h4>
            <div className={userStyles.aidOptions}>
              <div className={userStyles.aidCard}>
                <strong>Government Relief Fund</strong>
                <p>Up to ₹50,000 for house damage</p>
                <button className={userStyles.applyBtn}>Apply</button>
              </div>
              <div className={userStyles.aidCard}>
                <strong>Insurance Claim</strong>
                <p>Submit insurance claim documents</p>
                <button className={userStyles.applyBtn}>File Claim</button>
              </div>
              <div className={userStyles.aidCard}>
                <strong>Business Recovery Loan</strong>
                <p>Low-interest loans for businesses</p>
                <button className={userStyles.applyBtn}>Apply</button>
              </div>
            </div>
          </div>

          <div className={userStyles.recoveryStatus}>
            <h4>📊 Recovery Status</h4>
            <div className={userStyles.statusList}>
              <div className={userStyles.statusItem}>
                <span>Damage Assessment</span>
                <span className={userStyles.statusComplete}>✅ Complete</span>
              </div>
              <div className={userStyles.statusItem}>
                <span>Government Aid Application</span>
                <span className={userStyles.statusPending}>⏳ Under Review</span>
              </div>
              <div className={userStyles.statusItem}>
                <span>Insurance Claim</span>
                <span className={userStyles.statusPending}>⏳ Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
};

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editProfile, setEditProfile] = useState({
    name: '', username: '', phone: '', email: '', gender: '', password: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sosSending, setSosSending] = useState(false);
  const [lastSOS, setLastSOS] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedVolunteerAreas, setSelectedVolunteerAreas] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const router = useRouter();

  useEffect(() => {
    // Fetch actual user data from localStorage and backend
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const userId = parsedUser.id;
          
          // Fetch full user details from backend
          const response = await fetch(`http://localhost:8000/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            const formattedUser = {
              id: userData.id,
              name: userData.name || 'N/A',
              email: userData.email || 'N/A',
              phone: userData.phone || 'N/A',
              gender: userData.gender || 'N/A',
              username: userData.username || 'N/A',
              emergencyContact: userData.emergency_contact || '',
              address: userData.address || '',
              medicalConditions: userData.medical_conditions || ''
            };
            setUser(formattedUser);
            setEditedUser(formattedUser);
          } else {
            // Fallback to stored user data
            setUser(parsedUser);
            setEditedUser(parsedUser);
          }
        } else {
          // Default data if no user is logged in
          const defaultUser = {
            name: 'Guest User',
            email: 'guest@example.com',
            phone: 'N/A',
            gender: 'N/A',
            username: 'guest',
            emergencyContact: '',
            address: '',
            medicalConditions: ''
          };
          setUser(defaultUser);
          setEditedUser(defaultUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      setLoading(false);
    };

    fetchUserData();
    fetchAlerts();
    fetchInventory();
    fetchMyRequests();
    fetchCommunityReports();
    fetchShelters();
const iv = setInterval(fetchAlerts, 5000);
const iv2 = setInterval(fetchMyRequests, 10000);
const iv3 = setInterval(fetchCommunityReports, 15000);
const iv4 = setInterval(fetchShelters, 20000);
return () => {
  clearInterval(iv);
  clearInterval(iv2);
  clearInterval(iv3);
  clearInterval(iv4);
};
  }, [router]);

  const handleLogout = () => {
    router.push('/login');
  };

  const handleFeatureClick = (path) => {
    if (path) {
      router.push(path);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts');
      const data = await res.json();
      setAlerts(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      // ignore
    }
  };
  
  const sendSOS = async () => {
    if (sosSending) return;
    setSosSending(true);
    try {
      const getPosition = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
      const coords = await getPosition();
      const message = coords
        ? `SOS Emergency - Flood situation. Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
        : 'SOS Emergency - Flood situation (location unavailable)';
      const resp = await fetch('http://localhost:8000/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'SOS Emergency', message, risk: 'high' })
      });
      const data = await resp.json();
      setLastSOS({ ok: resp.ok, data });
      if (resp.ok) {
        alert('SOS sent to admin!');
      } else {
        alert(`Failed to send SOS: ${data?.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to send SOS');
    } finally {
      setSosSending(false);
    }
  };
  
  const handleSidebarClick = (section) => {
    setActiveSection(section);
  };

  const openGoogleMaps = (locationName) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
    window.open(mapsUrl, '_blank');
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/inventory');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/resource-requests');
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch requests:', e);
    }
  };

  const requestResource = async (resourceName, quantity) => {
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/resource-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          resource_name: resourceName,
          quantity: parseInt(quantity)
        })
      });
      if (resp.ok) {
        alert('Resource request submitted!');
        fetchMyRequests();
      } else {
        alert('Failed to submit request');
      }
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  const fetchCommunityReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/community-reports');
      const data = await res.json();
      setCommunityReports(Array.isArray(data) ? data.slice(0, 5) : []); // Show latest 5
    } catch (e) {
      console.error('Failed to fetch community reports:', e);
    }
  };

  const submitCommunityReport = async (reportType, description) => {
    if (!description || !reportType || reportType === 'Select Report Type') {
      alert('Please select report type and enter description');
      return;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/community-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          report_type: reportType,
          description: description
        })
      });
      if (resp.ok) {
        alert('Report submitted successfully!');
        fetchCommunityReports();
        return true;
      } else {
        alert('Failed to submit report');
        return false;
      }
    } catch (err) {
      alert('Failed to submit report');
      return false;
    }
  };

  const fetchShelters = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/shelters');
      const data = await res.json();
      setShelters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch shelters:', e);
    }
  };

  const submitDonation = async (amount) => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return false;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          amount: parseFloat(amount),
          donor_name: user?.name || 'Anonymous',
          donor_email: user?.email || ''
        })
      });
      if (resp.ok) {
        alert('Donation submitted successfully! Thank you for your support!');
        return true;
      } else {
        alert('Failed to submit donation');
        return false;
      }
    } catch (err) {
      alert('Failed to submit donation');
      return false;
    }
  };

  const submitItemPickup = async (items, address) => {
    if (!items || !address) {
      alert('Please select items and enter pickup address');
      return false;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/item-pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          items: items,
          pickup_address: address,
          contact_number: user?.phone || ''
        })
      });
      if (resp.ok) {
        alert('Pickup scheduled successfully!');
        return true;
      } else {
        alert('Failed to schedule pickup');
        return false;
      }
    } catch (err) {
      alert('Failed to schedule pickup');
      return false;
    }
  };

  const submitVolunteerRequest = async (areas, durationMonths) => {
    if (!areas || areas.length === 0) {
      alert('Please select at least one area of interest');
      return false;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/volunteer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          volunteer_name: user?.name || '',
          volunteer_email: user?.email || '',
          volunteer_phone: user?.phone || '',
          areas_of_interest: areas,
          duration_months: durationMonths || 1
        })
      });
      if (resp.ok) {
        alert('Volunteer registration submitted successfully!');
        return true;
      } else {
        alert('Failed to submit volunteer request');
        return false;
      }
    } catch (err) {
      alert('Failed to submit volunteer request');
      return false;
    }
  };

  const submitDamageReport = async (propertyType, damageLevel, estimatedLoss, description) => {
    if (!propertyType || !damageLevel || !estimatedLoss || estimatedLoss <= 0) {
      alert('Please fill all required fields');
      return false;
    }
    try {
      console.log('Submitting damage report:', { propertyType, damageLevel, estimatedLoss, description });
      const resp = await fetch('http://localhost:8000/api/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          property_type: propertyType,
          damage_level: damageLevel,
          estimated_loss: parseFloat(estimatedLoss),
          description: description || ''
        })
      });
      const data = await resp.json();
      console.log('Response:', data);
      if (resp.ok) {
        alert('Damage report submitted successfully!');
        return true;
      } else {
        alert(`Failed to submit damage report: ${data.detail || 'Unknown error'}`);
        return false;
      }
    } catch (err) {
      console.error('Error submitting damage report:', err);
      alert(`Failed to submit damage report: ${err.message}`);
      return false;
    }
  };

  const applyForFinancialAid = async (aidType, amount) => {
    if (!aidType || !amount || amount <= 0) {
      alert('Please enter a valid amount');
      return false;
    }
    try {
      console.log('Submitting financial aid:', { aidType, amount });
      const resp = await fetch('http://localhost:8000/api/financial-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          aid_type: aidType,
          amount_requested: parseFloat(amount),
          purpose: `${aidType} request`
        })
      });
      const data = await resp.json();
      console.log('Response:', data);
      if (resp.ok) {
        alert('Financial aid request submitted successfully!');
        return true;
      } else {
        alert(`Failed to submit financial aid request: ${data.detail || 'Unknown error'}`);
        return false;
      }
    } catch (err) {
      console.error('Error submitting financial aid:', err);
      alert(`Failed to submit financial aid request: ${err.message}`);
      return false;
    }
  };

  const updateProfile = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser.id;
        
        // Send update to backend
        const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editedUser.name,
            email: editedUser.email,
            phone: editedUser.phone,
            gender: editedUser.gender,
            emergency_contact: editedUser.emergencyContact,
            address: editedUser.address,
            medical_conditions: editedUser.medicalConditions
          })
        });
        
        if (response.ok) {
          setUser(editedUser);
          setIsEditingProfile(false);
          alert('Profile updated successfully!');
        } else {
          const error = await response.json();
          alert(`Failed to update profile: ${error.detail || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleProfileChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sidebarItems = [
    { icon: AlertTriangle, text: 'Live Alerts', key: 'alerts' },
   
    { icon: User, text: 'User Profile', key: 'profile' },
    { icon: Map, text: 'Interactive Map', key: 'map' },
    { icon: Shield, text: 'SOS Emergency', key: 'sos' },
    { icon: Home, text: 'Shelters', key: 'shelters' },
    { icon: Truck, text: 'Resources', key: 'resources' },
    { icon: Users, text: 'Community', key: 'community' },
    { icon: Phone, text: 'Helpline', key: 'helpline' },
    { icon: BookOpen, text: 'Education', key: 'education' },
    { icon: Heart, text: 'Donation', key: 'donation' },
    { icon: Wrench, text: 'Recovery', key: 'recovery' },
    { icon: LogOut, text: 'Logout', onClick: handleLogout }
  ];

  if (loading) {
    return createElement('div', { className: styles.container },
      createElement('div', { className: styles.heroContent },
        createElement('p', { className: styles.heroSubtitle }, 'Loading...')
      )
    );
  }

  if (!user) {
    return null;
  }

  return createElement('div', { className: styles.container },
    // Navigation
    createElement('nav', { className: styles.navbar },
      createElement('div', { className: styles.navContainer },
        createElement('div', { className: styles.navLogo },
          createElement('span', { className: styles.logoIcon }, '🌱'),
          createElement('span', null, 'ACMS User Dashboard')
        ),
        createElement('ul', { className: `${styles.navMenu} ${isMenuOpen ? styles.active : ''}` },
          createElement('li', { className: styles.navItem },
            createElement('a', { href: '/', className: styles.navLink }, 'Home')
          ),
          createElement('li', { className: styles.navItem },
            createElement('a', { className: styles.navLink, onClick: handleLogout }, 'Logout')
          )
        ),
        createElement('div', {
          className: `${styles.hamburger} ${isMenuOpen ? styles.active : ''}`,
          onClick: toggleMenu
        },
          createElement('span', { className: styles.bar }),
          createElement('span', { className: styles.bar }),
          createElement('span', { className: styles.bar })
        )
      )
    ),
    // Dashboard Layout
    createElement('div', { className: userStyles.dashboardLayout },
      // Sidebar
      createElement('aside', {
        className: `${userStyles.sidebar} ${isMenuOpen ? '' : userStyles.closed}`
      },
        createElement('ul', { style: { listStyle: 'none', padding: '10px 0' } },
          sidebarItems.map((item, index) =>
            createElement('li', {
              key: index,
              className: `${userStyles.sidebarItem} ${activeSection === item.key ? userStyles.active : ''}`,
              onClick: item.onClick || (() => handleSidebarClick(item.key))
            },
              createElement(item.icon, { className: userStyles.sidebarIcon }),
              item.text
            )
          )
        )
      ),
      // Main Content
      createElement('main', { 
        className: `${userStyles.mainContent} ${isMenuOpen ? userStyles.shifted : ''}`
      },
        activeSection === 'dashboard' ? 
          createElement('div', null,
            createElement('h2', { className: styles.sectionTitle }, '🔥 Complete ACMS Features'),
            createElement('div', { className: styles.featuresGrid },
              features.map((feature, index) =>
                createElement('div', {
                  key: index,
                  className: styles.featureCard,
                  onClick: () => handleFeatureClick(feature.path),
                  style: feature.path ? { cursor: 'pointer' } : {}
                },
                  createElement('div', { className: styles.featureIcon },
                    createElement('span', null, feature.icon)
                  ),
                  createElement('div', { className: styles.featureContent },
                    createElement('h3', null, feature.title),
                    createElement('p', null, feature.description),
                    createElement('div', { className: styles.featureDetails },
                      feature.details.map((detail, idx) =>
                        createElement('span', { key: idx }, detail)
                      )
                    ),
                    createElement('div', { className: styles.featureArrow },
                      createElement('span', null, '→')
                    )
                  )
                )
              )
            )
          )
        : (
            activeSection === 'alerts'
              ? createElement('div', { className: userStyles.sectionContent },
                  createElement('h3', null, '🚨 Active Alerts'),
                  createElement('div', null,
                    alerts.map((a) => {
                      const color = a.type === 'error'
                        ? '#ff4d4f'
                        : (a.type === 'warning' ? '#3b82f6' : '#10b981');
                      return createElement('div', {
                          key: a.alert_id,
                          style: {
                            border: `1px solid ${color}55`,
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }
                        },
                        createElement('div', { style: { fontWeight: 600, color } }, a.title),
                        createElement('div', { style: { opacity: 0.9 } }, a.message),
                        createElement('div', { style: { fontSize: '12px', opacity: 0.7 } },
                          new Date(a.time).toLocaleString()
                        )
                      );
                    })
                  )
                )
              : (activeSection === 'sos'
                  ? createElement('div', { className: userStyles.sectionContent },
                      createElement('h3', null, '🆘 Emergency Assistance'),
                      createElement('div', { className: userStyles.emergencySection },
                        createElement('button', {
                          className: userStyles.sosBtn,
                          onClick: sendSOS,
                          disabled: sosSending
                        }, sosSending ? 'Sending...' : '🚨 SEND SOS'),
                        createElement('p', { className: userStyles.sosText }, 'Press for immediate rescue assistance')
                      ),
                      createElement('div', { className: userStyles.locationSection },
                        createElement('h4', null, '📍 Location Sharing'),
                        createElement('button', { className: userStyles.shareLocationBtn, onClick: sendSOS }, 'Share Live Location + Send SOS'),
                        lastSOS ? createElement('p', null, `Last SOS: ${lastSOS.ok ? 'sent successfully ✅' : 'failed ❌'}`) : null
                      ),
                      createElement('div', { className: userStyles.emergencyContacts },
                        createElement('h4', null, '📞 Emergency Numbers'),
                        createElement('div', { className: userStyles.contactGrid },
                          createElement('div', { className: userStyles.contactCard },
                            createElement('strong', null, 'Police'),
                            createElement('a', { href: 'tel:100' }, '100')
                          ),
                          createElement('div', { className: userStyles.contactCard },
                            createElement('strong', null, 'Fire Brigade'),
                            createElement('a', { href: 'tel:101' }, '101')
                          ),
                          createElement('div', { className: userStyles.contactCard },
                            createElement('strong', null, 'Ambulance'),
                            createElement('a', { href: 'tel:102' }, '102')
                          ),
                          createElement('div', { className: userStyles.contactCard },
                            createElement('strong', null, 'Disaster Helpline'),
                            createElement('a', { href: 'tel:1078' }, '1078')
                          )
                        )
                      )
                    )
                  : (activeSection === 'resources'
                      ? createElement('div', { className: userStyles.sectionContent },
                          createElement('h3', null, '📦 Available Resources'),
                          createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' } },
                            inventory.map((item) => 
                              createElement('div', {
                                key: item.id,
                                style: {
                                  padding: '15px',
                                  backgroundColor: '#1e293b',
                                  borderRadius: '8px',
                                  border: '1px solid #334155'
                                }
                              },
                                createElement('h4', { style: { margin: '0 0 10px 0', color: '#10b981' } }, item.resource_name),
                                createElement('p', { style: { margin: '5px 0', fontSize: '24px', fontWeight: 'bold' } }, item.quantity),
                                createElement('p', { style: { margin: '0', fontSize: '12px', opacity: 0.7 } }, item.unit || 'units'),
                                createElement('input', {
                                  type: 'number',
                                  placeholder: 'Quantity',
                                  id: `qty-${item.id}`,
                                  style: {
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '10px',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    color: 'white'
                                  }
                                }),
                                createElement('button', {
                                  onClick: () => {
                                    const qty = document.getElementById(`qty-${item.id}`).value;
                                    requestResource(item.resource_name, qty);
                                  },
                                  style: {
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '8px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }
                                }, 'Request')
                              )
                            )
                          ),
                          createElement('h3', { style: { marginTop: '30px' } }, '📋 My Requests'),
                          createElement('div', null,
                            myRequests.length === 0 
                              ? createElement('p', { style: { opacity: 0.6 } }, 'No requests yet')
                              : myRequests.map((req) =>
                                  createElement('div', {
                                    key: req.id,
                                    style: {
                                      padding: '12px',
                                      backgroundColor: '#1e293b',
                                      borderRadius: '8px',
                                      marginBottom: '10px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }
                                  },
                                    createElement('div', null,
                                      createElement('strong', null, `${req.resource_name} - ${req.quantity}`),
                                      createElement('div', { style: { fontSize: '12px', opacity: 0.7, marginTop: '4px' } },
                                        new Date(req.requested_at).toLocaleString()
                                      )
                                    ),
                                    createElement('span', {
                                      style: {
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: req.status === 'approved' ? '#10b98144' : (req.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                                        color: req.status === 'approved' ? '#10b981' : (req.status === 'rejected' ? '#ef4444' : '#f59e0b')
                                      }
                                    }, req.status.toUpperCase())
                                  )
                                )
                          )
                        )
                      : (activeSection === 'shelters'
                          ? createElement('div', { className: userStyles.sectionContent },
                              createElement('h3', null, '🏠 Available Shelters'),
                              createElement('div', { className: userStyles.shelterList },
                                shelters.length === 0
                                  ? createElement('p', { style: { opacity: 0.6, padding: '20px', textAlign: 'center' } }, 'No shelters available yet')
                                  : shelters.map((shelter) => {
                                      const bedsAvailable = shelter.beds_available || shelter.capacity;
                                      const capacityStatus = bedsAvailable > 50 ? 'available' : (bedsAvailable > 0 ? 'limited' : 'full');
                                      return createElement('div', {
                                        key: shelter.id,
                                        className: userStyles.shelterCard,
                                        style: {
                                          padding: '15px',
                                          backgroundColor: '#1e293b',
                                          borderRadius: '8px',
                                          marginBottom: '15px',
                                          border: '1px solid #334155'
                                        }
                                      },
                                        createElement('h4', { style: { margin: '0 0 10px 0' } }, shelter.name),
                                        createElement('p', { style: { margin: '5px 0', fontSize: '14px', opacity: 0.8 } }, `📍 ${shelter.distance_km || 'N/A'} km away`),
                                        createElement('div', { 
                                          className: userStyles.shelterCapacity,
                                          style: { display: 'flex', gap: '10px', margin: '10px 0', flexWrap: 'wrap' }
                                        },
                                          createElement('span', {
                                            className: userStyles[capacityStatus],
                                            style: {
                                              padding: '4px 8px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              backgroundColor: capacityStatus === 'available' ? '#10b98144' : (capacityStatus === 'limited' ? '#f59e0b44' : '#ef444444'),
                                              color: capacityStatus === 'available' ? '#10b981' : (capacityStatus === 'limited' ? '#f59e0b' : '#ef4444')
                                            }
                                          }, `${bedsAvailable} beds available`),
                                          createElement('span', { style: { fontSize: '12px' } }, `Food: ${shelter.has_food ? '✅' : '❌'}`),
                                          createElement('span', { style: { fontSize: '12px' } }, `Medical: ${shelter.has_medical ? '✅' : '❌'}`)
                                        ),
                                        createElement('button', {
                                          className: userStyles.directionsBtn,
                                          onClick: () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.name + ' ' + shelter.assigned_region)}`, '_blank'),
                                          disabled: bedsAvailable === 0,
                                          style: {
                                            padding: '8px 16px',
                                            backgroundColor: bedsAvailable === 0 ? '#666' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: bedsAvailable === 0 ? 'not-allowed' : 'pointer',
                                            marginTop: '10px'
                                          }
                                        }, bedsAvailable === 0 ? 'Full' : 'Get Directions')
                                      );
                                    })
                              )
                            )
                          : (activeSection === 'community'
                          ? createElement('div', { className: userStyles.sectionContent },
                              createElement('h3', null, '👥 Community Reports'),
                              createElement('div', { className: userStyles.reportForm },
                                createElement('h4', null, '📝 Submit Report'),
                                createElement('select', {
                                  id: 'reportType',
                                  className: userStyles.reportType,
                                  style: {
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '10px',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    color: 'white'
                                  }
                                },
                                  createElement('option', null, 'Select Report Type'),
                                  createElement('option', null, 'Blocked Road'),
                                  createElement('option', null, 'Damaged Bridge'),
                                  createElement('option', null, 'Flood Hotspot'),
                                  createElement('option', null, 'Rescue Needed'),
                                  createElement('option', null, 'Other')
                                ),
                                createElement('textarea', {
                                  id: 'reportDescription',
                                  placeholder: 'Describe the situation...',
                                  rows: 4,
                                  style: {
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '10px',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    color: 'white',
                                    resize: 'vertical'
                                  }
                                }),
                                createElement('button', {
                                  className: userStyles.submitReportBtn,
                                  onClick: async () => {
                                    const type = document.getElementById('reportType').value;
                                    const desc = document.getElementById('reportDescription').value;
                                    const success = await submitCommunityReport(type, desc);
                                    if (success) {
                                      document.getElementById('reportType').value = 'Select Report Type';
                                      document.getElementById('reportDescription').value = '';
                                    }
                                  },
                                  style: {
                                    padding: '10px 20px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }
                                }, 'Submit Report')
                              ),
                              createElement('div', { className: userStyles.communityReports, style: { marginTop: '30px' } },
                                createElement('h4', null, '🌍 Recent Community Reports'),
                                communityReports.length === 0
                                  ? createElement('p', { style: { opacity: 0.6 } }, 'No reports yet')
                                  : communityReports.map((report) =>
                                      createElement('div', {
                                        key: report.id,
                                        className: userStyles.reportItem,
                                        style: {
                                          padding: '12px',
                                          backgroundColor: '#1e293b',
                                          borderRadius: '8px',
                                          marginBottom: '10px',
                                          borderLeft: '3px solid #10b981'
                                        }
                                      },
                                        createElement('strong', null, `${report.report_type} - ${report.user_name}`),
                                        createElement('p', { style: { margin: '5px 0', opacity: 0.9 } }, report.description),
                                        createElement('span', {
                                          className: userStyles.reportTime,
                                          style: { fontSize: '12px', opacity: 0.7 }
                                        }, new Date(report.reported_at).toLocaleString())
                                      )
                                    )
                              )
                            )
                          : (activeSection === 'donation'
                              ? createElement('div', { className: userStyles.sectionContent },
                                  createElement('h3', null, '❤️ Support Relief Efforts'),
                                  // Donation Section
                                  createElement('div', { style: { marginBottom: '30px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                    createElement('h4', null, '💰 Make a Donation'),
                                    createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' } },
                                      [500, 1000, 2000, 5000].map(amt => 
                                        createElement('button', {
                                          key: amt,
                                          onClick: () => setSelectedAmount(amt),
                                          style: {
                                            padding: '10px 20px',
                                            backgroundColor: selectedAmount === amt ? '#10b981' : '#334155',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                          }
                                        }, `₹${amt}`)
                                      )
                                    ),
                                    createElement('input', {
                                      id: 'customAmount',
                                      type: 'number',
                                      placeholder: 'Custom amount',
                                      onChange: (e) => setSelectedAmount(parseFloat(e.target.value)),
                                      style: {
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        color: 'white'
                                      }
                                    }),
                                    createElement('button', {
                                      onClick: async () => {
                                        const success = await submitDonation(selectedAmount);
                                        if (success) {
                                          setSelectedAmount(null);
                                          document.getElementById('customAmount').value = '';
                                        }
                                      },
                                      style: {
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                      }
                                    }, 'Donate Now')
                                  ),
                                  // Item Pickup Section
                                  createElement('div', { style: { marginBottom: '30px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                    createElement('h4', null, '📦 Donate Items'),
                                    createElement('textarea', {
                                      id: 'pickupItems',
                                      placeholder: 'Specify quantities and pickup address',
                                      rows: 3,
                                      style: {
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        color: 'white',
                                        resize: 'vertical'
                                      }
                                    }),
                                    createElement('button', {
                                      onClick: async () => {
                                        const items = document.getElementById('pickupItems').value;
                                        const success = await submitItemPickup(items, items);
                                        if (success) document.getElementById('pickupItems').value = '';
                                      },
                                      style: {
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                      }
                                    }, 'Schedule Pickup')
                                  ),
                                  // Volunteer Section
                                  createElement('div', { style: { padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                    createElement('h4', null, '🙋‍♂️ Volunteer Registration'),
                                    createElement('select', {
                                      id: 'volunteerDuration',
                                      style: {
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        color: 'white'
                                      }
                                    },
                                      createElement('option', { value: 1 }, '1 Month'),
                                      createElement('option', { value: 2 }, '2 Months'),
                                      createElement('option', { value: 6 }, '6 Months')
                                    ),
                                    createElement('textarea', {
                                      id: 'volunteerAreas',
                                      placeholder: 'Areas of interest (e.g., Rescue Operations, Medical Assistance)',
                                      rows: 2,
                                      style: {
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        color: 'white',
                                        resize: 'vertical'
                                      }
                                    }),
                                    createElement('button', {
                                      onClick: async () => {
                                        const areas = document.getElementById('volunteerAreas').value;
                                        const duration = document.getElementById('volunteerDuration').value;
                                        const success = await submitVolunteerRequest(areas, parseInt(duration));
                                        if (success) document.getElementById('volunteerAreas').value = '';
                                      },
                                      style: {
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                      }
                                    }, 'Register as Volunteer')
                                  )
                                )
                              : (activeSection === 'profile'
                                  ? createElement('div', { className: userStyles.sectionContent },
                                      createElement('h3', null, '👤 Profile Information'),
                                      // Display Mode
                                      !isEditingProfile && createElement('div', { style: { marginBottom: '20px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                        createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' } },
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Full Name'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.name || 'N/A')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Email'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.email || 'N/A')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Phone Number'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.phone || 'N/A')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Gender'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.gender || 'N/A')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Emergency Contact'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.emergencyContact || 'Not set')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Address'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.address || 'Not set')
                                          ),
                                          createElement('div', null,
                                            createElement('strong', { style: { display: 'block', marginBottom: '5px', opacity: 0.7 } }, 'Medical Conditions'),
                                            createElement('div', { style: { fontSize: '16px' } }, user?.medicalConditions || 'None')
                                          )
                                        ),
                                        createElement('button', {
                                          onClick: () => setIsEditingProfile(true),
                                          style: {
                                            marginTop: '20px',
                                            padding: '12px 24px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                          }
                                        }, '✏️ Edit Profile')
                                      ),
                                      // Edit Mode
                                      isEditingProfile && createElement('div', { style: { padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                        createElement('h4', { style: { marginBottom: '20px' } }, 'Edit Profile'),
                                        createElement('div', { style: { display: 'grid', gap: '15px' } },
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Full Name'),
                                            createElement('input', {
                                              type: 'text',
                                              value: editedUser.name || '',
                                              onChange: (e) => handleProfileChange('name', e.target.value),
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            })
                                          ),
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Email'),
                                            createElement('input', {
                                              type: 'email',
                                              value: editedUser.email || '',
                                              onChange: (e) => handleProfileChange('email', e.target.value),
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            })
                                          ),
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Phone Number'),
                                            createElement('input', {
                                              type: 'tel',
                                              value: editedUser.phone || '',
                                              onChange: (e) => handleProfileChange('phone', e.target.value),
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            })
                                          ),
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Emergency Contact'),
                                            createElement('input', {
                                              type: 'tel',
                                              value: editedUser.emergencyContact || '',
                                              onChange: (e) => handleProfileChange('emergencyContact', e.target.value),
                                              placeholder: 'Emergency contact number',
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            })
                                          ),
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Address'),
                                            createElement('textarea', {
                                              value: editedUser.address || '',
                                              onChange: (e) => handleProfileChange('address', e.target.value),
                                              placeholder: 'Your complete address',
                                              rows: 3,
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white',
                                                resize: 'vertical'
                                              }
                                            })
                                          ),
                                          createElement('div', null,
                                            createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '600' } }, 'Medical Conditions'),
                                            createElement('input', {
                                              type: 'text',
                                              value: editedUser.medicalConditions || '',
                                              onChange: (e) => handleProfileChange('medicalConditions', e.target.value),
                                              placeholder: 'Any medical conditions (diabetes, etc.)',
                                              style: {
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            })
                                          )
                                        ),
                                        createElement('div', { style: { display: 'flex', gap: '10px', marginTop: '20px' } },
                                          createElement('button', {
                                            onClick: updateProfile,
                                            style: {
                                              padding: '12px 24px',
                                              backgroundColor: '#10b981',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontWeight: '600'
                                            }
                                          }, '✓ Save Changes'),
                                          createElement('button', {
                                            onClick: () => {
                                              setEditedUser(user);
                                              setIsEditingProfile(false);
                                            },
                                            style: {
                                              padding: '12px 24px',
                                              backgroundColor: '#6b7280',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontWeight: '600'
                                            }
                                          }, '✗ Cancel')
                                        )
                                      )
                                    )
                                  : (activeSection === 'recovery'
                                  ? createElement('div', { className: userStyles.sectionContent },
                                      createElement('h3', null, '🏗️ Recovery & Compensation'),
                                      // Damage Report Section
                                      createElement('div', { style: { marginBottom: '30px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                        createElement('h4', null, '📋 Damage Assessment'),
                                        createElement('select', {
                                          id: 'propertyType',
                                          style: {
                                            width: '100%',
                                            padding: '10px',
                                            marginBottom: '10px',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            color: 'white'
                                          }
                                        },
                                          createElement('option', { value: '' }, 'Select Property Type'),
                                          createElement('option', { value: 'House' }, 'House'),
                                          createElement('option', { value: 'Apartment' }, 'Apartment'),
                                          createElement('option', { value: 'Commercial' }, 'Commercial'),
                                          createElement('option', { value: 'Vehicle' }, 'Vehicle'),
                                          createElement('option', { value: 'Agricultural Land' }, 'Agricultural Land')
                                        ),
                                        createElement('select', {
                                          id: 'damageLevel',
                                          style: {
                                            width: '100%',
                                            padding: '10px',
                                            marginBottom: '10px',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            color: 'white'
                                          }
                                        },
                                          createElement('option', { value: '' }, 'Select Damage Level'),
                                          createElement('option', { value: 'Minor (<25%)' }, 'Minor (<25%)'),
                                          createElement('option', { value: 'Moderate (25-50%)' }, 'Moderate (25-50%)'),
                                          createElement('option', { value: 'Major (50-75%)' }, 'Major (50-75%)'),
                                          createElement('option', { value: 'Severe (>75%)' }, 'Severe (>75%)')
                                        ),
                                        createElement('input', {
                                          id: 'estimatedLoss',
                                          type: 'number',
                                          placeholder: 'Estimated Loss Amount (₹)',
                                          style: {
                                            width: '100%',
                                            padding: '10px',
                                            marginBottom: '10px',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            color: 'white'
                                          }
                                        }),
                                        createElement('textarea', {
                                          id: 'damageDescription',
                                          placeholder: 'Description of damage...',
                                          rows: 3,
                                          style: {
                                            width: '100%',
                                            padding: '10px',
                                            marginBottom: '10px',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            color: 'white',
                                            resize: 'vertical'
                                          }
                                        }),
                                        createElement('button', {
                                          onClick: async () => {
                                            const propertyType = document.getElementById('propertyType').value;
                                            const damageLevel = document.getElementById('damageLevel').value;
                                            const estimatedLoss = document.getElementById('estimatedLoss').value;
                                            const description = document.getElementById('damageDescription').value;
                                            const success = await submitDamageReport(propertyType, damageLevel, estimatedLoss, description);
                                            if (success) {
                                              document.getElementById('propertyType').value = '';
                                              document.getElementById('damageLevel').value = '';
                                              document.getElementById('estimatedLoss').value = '';
                                              document.getElementById('damageDescription').value = '';
                                            }
                                          },
                                          style: {
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                          }
                                        }, 'Submit Damage Report')
                                      ),
                                      // Financial Aid Section
                                      createElement('div', { style: { padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' } },
                                        createElement('h4', null, '💰 Apply for Financial Aid'),
                                        createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' } },
                                          // Government Relief
                                          createElement('div', { style: { padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' } },
                                            createElement('strong', { style: { display: 'block', marginBottom: '8px' } }, 'Government Relief Fund'),
                                            createElement('p', { style: { fontSize: '13px', opacity: 0.8, marginBottom: '10px' } }, 'Up to ₹50,000 for house damage'),
                                            createElement('input', {
                                              id: 'govReliefAmount',
                                              type: 'number',
                                              placeholder: 'Amount (₹)',
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                marginBottom: '8px',
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            }),
                                            createElement('button', {
                                              onClick: async () => {
                                                const amount = document.getElementById('govReliefAmount').value;
                                                const success = await applyForFinancialAid('Government Relief Fund', amount);
                                                if (success) document.getElementById('govReliefAmount').value = '';
                                              },
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                              }
                                            }, 'Apply')
                                          ),
                                          // Insurance Claim
                                          createElement('div', { style: { padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' } },
                                            createElement('strong', { style: { display: 'block', marginBottom: '8px' } }, 'Insurance Claim'),
                                            createElement('p', { style: { fontSize: '13px', opacity: 0.8, marginBottom: '10px' } }, 'Submit insurance claim documents'),
                                            createElement('input', {
                                              id: 'insuranceAmount',
                                              type: 'number',
                                              placeholder: 'Amount (₹)',
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                marginBottom: '8px',
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            }),
                                            createElement('button', {
                                              onClick: async () => {
                                                const amount = document.getElementById('insuranceAmount').value;
                                                const success = await applyForFinancialAid('Insurance Claim', amount);
                                                if (success) document.getElementById('insuranceAmount').value = '';
                                              },
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                              }
                                            }, 'File Claim')
                                          ),
                                          // Business Loan
                                          createElement('div', { style: { padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' } },
                                            createElement('strong', { style: { display: 'block', marginBottom: '8px' } }, 'Business Recovery Loan'),
                                            createElement('p', { style: { fontSize: '13px', opacity: 0.8, marginBottom: '10px' } }, 'Low-interest loans for businesses'),
                                            createElement('input', {
                                              id: 'businessLoanAmount',
                                              type: 'number',
                                              placeholder: 'Amount (₹)',
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                marginBottom: '8px',
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '4px',
                                                color: 'white'
                                              }
                                            }),
                                            createElement('button', {
                                              onClick: async () => {
                                                const amount = document.getElementById('businessLoanAmount').value;
                                                const success = await applyForFinancialAid('Business Recovery Loan', amount);
                                                if (success) document.getElementById('businessLoanAmount').value = '';
                                              },
                                              style: {
                                                width: '100%',
                                                padding: '8px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                              }
                                            }, 'Apply')
                                          )
                                        )
                                      )
                                    )
                                  : (sidebarSections[activeSection]?.content ||
                              createElement('div', { className: userStyles.sectionContent },
                                createElement('h3', null, 'Section not found')
                              )
                            )
                        )
                    )
                )
          )
      )
  ))))));
};

export default UserDashboard;