import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  DollarSign,
  Navigation,
  LayoutDashboard
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

const IndiaRiskMap = () => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const draw = () => {
      if (!window.google || !window.google.visualization) return;
      const data = window.google.visualization.arrayToDataTable([
        ['State', 'Risk'],
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
      const height = 420;
      const options = {
        region: 'IN',
        resolution: 'provinces',
        legend: 'none',
        colorAxis: { colors: ['#10b981', '#f59e0b', '#ef4444'] },
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

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sosSending, setSosSending] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [lastDonationAmount, setLastDonationAmount] = useState('');
  const [damageSuccess, setDamageSuccess] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [donationForm, setDonationForm] = useState({ amount: '', donor_name: '', donor_email: '' });
  const [volunteerForm, setVolunteerForm] = useState({ volunteer_name: '', volunteer_email: '', volunteer_phone: '', areas_of_interest: '', duration_months: 1 });
  const [damageForm, setDamageForm] = useState({ property_type: 'residential', description: '', estimated_loss: '' });
  const [resourceForm, setResourceForm] = useState({ resource_name: '', quantity: 1, notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const response = await fetch(`http://localhost:8000/api/users/${parsedUser.id}`);
          if (response.ok) {
            const userData = await response.json();
            const formatted = {
              id: userData.id,
              name: userData.name || 'N/A',
              email: userData.email || 'N/A',
              phone: userData.phone || 'N/A',
              gender: userData.gender || 'N/A',
              emergencyContact: userData.emergency_contact || '',
              address: userData.address || '',
              medicalConditions: userData.medical_conditions || ''
            };
            setUser(formatted);
            setEditedUser(formatted);
          } else {
            setUser(parsedUser);
            setEditedUser(parsedUser);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };

    fetchUserData();
    fetchAlerts();
    fetchInventory();
    fetchMyRequests();
    fetchCommunityReports();
    fetchShelters();

    const iv = setInterval(fetchAlerts, 10000);
    return () => clearInterval(iv);
  }, [router]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts');
      const data = await res.json();
      setAlerts(Array.isArray(data.data) ? data.data : []);
    } catch (e) {}
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/inventory');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/resource-requests');
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const fetchCommunityReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/community-reports');
      const data = await res.json();
      setCommunityReports(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const fetchShelters = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/shelters');
      const data = await res.json();
      setShelters(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const sendSOS = async () => {
    if (sosSending) return;
    setSosSending(true);
    try {
      const resp = await fetch('http://localhost:8000/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'SOS Emergency', message: `User ${user.name} sent SOS`, risk: 'high' })
      });
      if (resp.ok) alert('SOS sent successfully!');
    } catch (err) { alert('Failed to send SOS'); }
    finally { setSosSending(false); }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedUser.name,
          phone: editedUser.phone,
          emergency_contact: editedUser.emergencyContact,
          address: editedUser.address,
          medical_conditions: editedUser.medicalConditions
        })
      });
      if (response.ok) {
        const updated = await response.json();
        const formatted = {
          ...user,
          name: updated.name,
          phone: updated.phone,
          emergencyContact: updated.emergency_contact,
          address: updated.address,
          medicalConditions: updated.medical_conditions
        };
        setUser(formatted);
        localStorage.setItem('user', JSON.stringify(formatted));
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Update Error:', error);
      alert('Error updating profile');
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...donationForm, amount: parseFloat(donationForm.amount) || 0, user_id: user.id })
      });
      if (res.ok) {
        const savedAmount = donationForm.amount;
        setIsDonationModalOpen(false);
        setDonationForm({ amount: '', donor_name: '', donor_email: '' });
        setLastDonationAmount(savedAmount);
        setDonationSuccess(true);
      } else {
        alert('Payment failed. (Server rejected data)');
      }
    } catch (err) { alert('Failed to process donation.'); }
    finally { setIsSubmitting(false); }
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/volunteer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...volunteerForm, user_id: user.id })
      });
      if (res.ok) {
        alert('Welcome to the vanguard! Your request to enroll as an agent is being processed.');
        setIsVolunteerModalOpen(false);
        setVolunteerForm({ volunteer_name: '', volunteer_email: '', volunteer_phone: '', areas_of_interest: '', duration_months: 1 });
      }
    } catch (err) { alert('Failed to submit enrollment.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...damageForm, damage_level: 'severe', estimated_loss: parseFloat(damageForm.estimated_loss) || 0, user_id: user.id, user_name: user.name })
      });
      if (res.ok) {
        setIsDamageModalOpen(false);
        setDamageForm({ property_type: 'residential', description: '', estimated_loss: '' });
        setDamageSuccess(true);
      } else {
        alert('Server validation failed for damage report.');
      }
    } catch (err) { alert('Failed to broadcast damage report.'); }
    finally { setIsSubmitting(false); }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/resource-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resourceForm, user_id: user.id })
      });
      if (res.ok) {
        alert('Request transmission successful. The Resource Allocation Agent is processing your queue.');
        setIsResourceModalOpen(false);
        setResourceForm({ resource_name: '', quantity: 1, notes: '' });
        fetchMyRequests();
      }
    } catch (err) { alert('Failed to broadcast resource request.'); }
    finally { setIsSubmitting(false); }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, text: 'Dashboard', key: 'dashboard' },
    { icon: AlertTriangle, text: 'Alerts', key: 'alerts' },
    { icon: Shield, text: 'SOS', key: 'sos' },
    { icon: Truck, text: 'Resources', key: 'resources' },
    { icon: Navigation, text: 'Routes', key: 'routes' },
    { icon: Map, text: 'Map', key: 'map' },
    { icon: Heart, text: 'Donation', key: 'donation' },
    { icon: Wrench, text: 'Recovery', key: 'recovery' },
    { icon: User, text: 'Profile', key: 'profile' },
    { icon: LogOut, text: 'Logout', onClick: handleLogout }
  ];

  if (loading) return <div className={styles.loading}>Loading ACMS...</div>;

  return createElement('div', { className: styles.container },
    createElement('nav', { className: styles.navbar },
      createElement('div', { className: styles.navContainer },
        createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '20px' } },
          createElement('button', { className: styles.hamburger, onClick: () => setIsMenuOpen(!isMenuOpen) }, 
            createElement('span', { className: styles.bar }),
            createElement('span', { className: styles.bar }),
            createElement('span', { className: styles.bar })
          ),
          createElement('div', { className: styles.navLogo },
            createElement('span', { className: styles.logoIcon }, '🌱'),
            createElement('span', null, 'ACMS User')
          )
        ),
        createElement('div', { className: styles.navRight },
          createElement('button', { className: styles.logoutBtn, onClick: handleLogout }, 'Logout 🚪')
        )
      )
    ),
    createElement('div', { className: userStyles.dashboardLayout },
      createElement('aside', { className: `${userStyles.sidebar} ${isMenuOpen ? '' : userStyles.closed}` },
        createElement('ul', null, 
          sidebarItems.map((item, index) => 
            createElement(motion.li, {
              key: item.key || index,
              className: `${userStyles.sidebarItem} ${activeSection === item.key ? userStyles.active : ''}`,
              onClick: item.onClick || (() => setActiveSection(item.key)),
              whileHover: { x: 5, backgroundColor: item.onClick ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
              'data-logout': item.onClick ? 'true' : 'false'
            },
              item.icon && createElement(item.icon, { className: userStyles.sidebarIcon }),
              item.text
            )
          )
        )
      ),
      createElement('div', { className: `${userStyles.mainContent} ${isMenuOpen ? userStyles.shifted : ''}` },
        createElement(AnimatePresence, { mode: 'wait' },
          activeSection === 'dashboard' ? (
            createElement(motion.div, { key: 'dash', initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
              createElement(motion.h2, { className: styles.sectionTitle }, '🍀 Features'),
              createElement(motion.div, { className: styles.featuresGrid },
                features.map((f, i) => 
                  createElement(motion.div, { key: i, className: styles.featureCard, onClick: () => router.push(f.path), whileHover: { y: -5 } },
                    createElement('div', { className: styles.featureIcon }, f.icon),
                    createElement('div', { className: styles.featureContent },
                      createElement('h3', null, f.title),
                      createElement('p', null, f.description)
                    )
                  )
                )
              )
            )
          ) : activeSection === 'alerts' ? (
            createElement(motion.div, { key: 'alerts', initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: userStyles.sectionContent },
              createElement('div', { style: { marginBottom: '40px' } },
                createElement('h2', { style: { fontSize: '42px', fontWeight: '900', margin: '0' } }, 'Live Alerts'),
                createElement('p', { style: { color: '#94A3B8', fontSize: '18px' } }, 'Real-time threat detection and monitoring across all sectors.')
              ),
              alerts.length === 0 ? createElement('p', { style: { textAlign: 'center', padding: '50px', color: '#94A3B8' } }, 'No active threats detected.') :
              createElement('div', { className: userStyles.notificationList }, 
                alerts.map((a, i) => createElement('div', { 
                  key: i, 
                  className: userStyles.alertCard,
                  style: { 
                    borderLeft: `4px solid ${a.type === 'error' ? '#EF4444' : (a.type === 'warning' ? '#F59E0B' : '#10B981')}`,
                    padding: '30px',
                    position: 'relative',
                    overflow: 'hidden'
                  } 
                }, 
                  createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' } },
                    createElement('span', { className: userStyles.alertBadge, style: { backgroundColor: a.type === 'error' ? '#EF4444' : '#F59E0B' } }, a.type === 'error' ? 'HIGH RISK' : 'MODERATE'),
                    createElement('span', { style: { opacity: 0.5, fontSize: '12px' } }, new Date(a.time).toLocaleTimeString())
                  ),
                  createElement('h3', { style: { fontSize: '24px', marginBottom: '10px' } }, a.title),
                  createElement('p', { style: { color: '#94A3B8', marginBottom: '25px' } }, a.message),
                  createElement('div', { style: { marginBottom: '20px' } },
                    createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' } }, 
                      createElement('span', null, 'CONFIDENCE METER'),
                      createElement('span', { style: { color: '#10B981' } }, '98% MATCH')
                    ),
                    createElement('div', { style: { height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' } },
                      createElement('div', { style: { width: '98%', height: '100%', background: '#10B981', borderRadius: '10px' } })
                    )
                  ),
                  createElement('div', { style: { display: 'flex', gap: '15px' } },
                    createElement('button', { className: userStyles.btn, style: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' } }, 'DETAILS'),
                    createElement('button', { className: userStyles.btn, style: { flex: 1 } }, 'MONITOR')
                  )
                ))
              )
            )
          ) : activeSection === 'sos' ? (
            createElement(motion.div, { key: 'sos', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent, style: { textAlign: 'center' } },
              createElement('div', { style: { marginBottom: '30px', marginTop: '40px' } }, 
                createElement('span', { style: { backgroundColor: 'rgba(239, 68, 68, 0.14)', color: '#FF6B6B', padding: '10px 20px', borderRadius: '50px', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' } }, '● CRITICAL PRIORITY SYSTEM')
              ),
              createElement('h2', { style: { fontSize: '64px', fontWeight: '900', color: '#FFF', margin: '0 0 30px 0', lineHeight: '1' } }, 'Immediate Assistance Required?'),
              createElement('p', { style: { color: '#94A3B8', fontSize: '20px', maxWidth: '700px', margin: '0 auto 60px', lineHeight: '1.6' } }, 'Pressing the button below will broadcast your precise GPS coordinates to the nearest dispatch center and activate all emergency protocols.'),
              
              createElement('div', { style: { position: 'relative', width: '360px', height: '360px', margin: '0 auto 80px' } },
                createElement(motion.div, { 
                  style: { position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)', filter: 'blur(20px)' },
                  animate: { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] },
                  transition: { duration: 3, repeat: Infinity }
                }),
                createElement('button', { 
                  className: userStyles.sosBtn, 
                  onClick: sendSOS,
                  disabled: sosSending,
                  style: { 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    fontSize: '48px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '15px',
                    border: '15px solid rgba(239, 68, 68, 0.14)'
                  } 
                }, 
                  createElement('span', { style: { filter: 'drop-shadow(0 0 10px #FF6B6B)' } }, '🆘'),
                  createElement('span', { style: { fontSize: '30px', fontWeight: '900' } }, 'SEND SOS')
                )
              ),

              createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', maxWidth: '1200px', margin: '0 auto' } },
                [
                  { icon: '🗺️', title: 'GPS LOCK', desc: 'Active monitoring with sub-meter precision enabled.' },
                  { icon: '📡', title: 'NETWORK', desc: 'Redundant satellite link standing by for signal.' },
                  { icon: '🛡️', title: 'SECURITY', desc: 'Encrypted E2EE transmission protocol engaged.' }
                ].map((s, i) => createElement('div', { key: i, className: userStyles.card, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px', textAlign: 'center' } },
                  createElement('span', { style: { fontSize: '32px', backgroundColor: 'rgba(255,255,255,0.02)', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' } }, s.icon),
                  createElement('div', null,
                      createElement('h4', { style: { margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '2px', color: '#10B981', marginBottom: '10px' } }, s.title),
                    createElement('p', { style: { margin: 0, fontSize: '14px', color: '#94A3B8', lineHeight: '1.5' } }, s.desc)
                  )
                ))
              )
            )
          ) : activeSection === 'resources' ? (
            createElement(motion.div, { key: 'res', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('h3', null, '📦 Resources'),
              createElement('div', { className: userStyles.grid }, 
                inventory.map((item, i) => createElement('div', { key: i, className: userStyles.card },
                  createElement('h4', null, item.resource_name),
                  createElement('p', null, `Stock: ${item.quantity} ${item.unit || ''}`),
                  createElement('button', { 
                    className: userStyles.btn, 
                    onClick: () => {
                      setResourceForm({ ...resourceForm, resource_name: item.resource_name });
                      setIsResourceModalOpen(true);
                    } 
                  }, 'Request')
                ))
              )
            )
          ) : activeSection === 'shelters' ? (
            createElement(motion.div, { key: 'shl', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('h3', null, '🏠 Shelters'),
              createElement('div', { className: userStyles.grid }, 
                shelters.map((s, i) => createElement('div', { key: i, className: userStyles.card },
                  createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } },
                    createElement('h4', { style: { margin: 0, fontSize: '20px' } }, s.name),
                    createElement('span', { className: userStyles.badge, style: { fontSize: '10px' } }, `${s.distance_km || '2.4'} KM AWAY`)
                  ),
                  createElement('p', { style: { color: '#94A3B8', marginBottom: '20px' } }, `Region: ${s.assigned_region}`),
                  createElement('div', { style: { display: 'flex', gap: '10px' } },
                    createElement('button', { 
                      className: userStyles.btn, 
                      style: { flex: 1, height: '45px', fontSize: '13px' },
                      onClick: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.name + ' ' + s.assigned_region)}`) 
                    }, 'Directions 📍'),
                    createElement('button', { 
                      className: userStyles.btn, 
                      style: { flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', height: '45px', fontSize: '13px' },
                      onClick: () => alert(`🔒 Enrollment Request Sent: You are now queued for placement at ${s.name}. Prepare for evacuation.`)
                    }, 'Stay Here 🏠')
                  )
                ))
              )
            )
          ) : activeSection === 'routes' ? (
            createElement(motion.div, { key: 'routes', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('h3', null, '🛣️ Evacuation Routes'),
              createElement('p', { style: { color: '#94A3B8', marginBottom: '24px' } }, 'Official safe corridors designated by NDRF. Tap "Navigate" to open live directions in Google Maps.'),
              createElement('div', { className: userStyles.grid },
                [
                  { name: 'Route Alpha — NH-44 Corridor', desc: 'Primary highway route via National Highway 44. Suitable for vehicles and large groups.', distance: '12.5 km', status: 'OPEN', statusColor: '#10B981', origin: 'Current Location', dest: 'NH-44, India' },
                  { name: 'Route Bravo — River Bypass', desc: 'Alternative inland road avoiding flood-prone riverbanks. For motorcycles and small vehicles.', distance: '8.2 km', status: 'CAUTION', statusColor: '#F59E0B', origin: 'Current Location', dest: 'River Bypass Road, India' },
                  { name: 'Route Charlie — Hill Track', desc: 'Elevated terrain route for pedestrians. High ground ensures safety during peak flood events.', distance: '5.1 km', status: 'OPEN', statusColor: '#10B981', origin: 'Current Location', dest: 'Hill Track Evacuation Route, India' }
                ].map((route, i) => createElement('div', { key: i, className: userStyles.card },
                  createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } },
                    createElement('h4', { style: { margin: 0, fontSize: '17px', flex: 1 } }, route.name),
                    createElement('span', { style: { fontSize: '10px', fontWeight: '900', color: route.statusColor, background: `${route.statusColor}20`, padding: '3px 10px', borderRadius: '20px', marginLeft: '10px', whiteSpace: 'nowrap' } }, route.status)
                  ),
                  createElement('p', { style: { color: '#94A3B8', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' } }, route.desc),
                  createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
                    createElement('span', { style: { fontSize: '12px', color: '#64748B' } }, `📏 ${route.distance}`),
                    createElement('span', { style: { fontSize: '12px', color: '#64748B' } }, '🚶 On Foot / Vehicle')
                  ),
                  createElement('button', {
                    className: userStyles.btn,
                    style: { width: '100%', height: '45px', fontSize: '13px' },
                    onClick: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(route.dest)}&travelmode=driving`)
                  }, '🧭 Navigate via Google Maps')
                ))
              )
            )
          ) : activeSection === 'map' ? (
            createElement(motion.div, { key: 'map', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('h3', null, '🗺️ Interactive Map'),
              createElement(IndiaRiskMap)
            )
          ) : activeSection === 'profile' ? (
            createElement(motion.div, { key: 'prof', initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, className: userStyles.sectionContent },
              createElement('div', { className: userStyles.profileHeader },
                createElement('div', null,
                  createElement('h1', { className: userStyles.profileTitle }, 'Personal Account'),
                  createElement('p', { className: userStyles.profileSubtext }, 'Manage your profile, system credentials and preferences.')
                ),
                createElement('button', { 
                  className: userStyles.editProfileBtn, 
                  onClick: () => setIsEditingProfile(!isEditingProfile) 
                }, 
                  createElement('span', null, isEditingProfile ? '✖' : '📝'), 
                  isEditingProfile ? 'Cancel Edit' : 'Edit Profile'
                )
              ),

              !isEditingProfile ? (
                /* High Fidelity Profile View */
                createElement('div', null,
                  createElement('div', { className: userStyles.card, style: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '50px', padding: '50px', alignItems: 'center' } },
                    createElement('div', { className: userStyles.avatarCircle }, 
                      (user?.name || 'A')[0].toUpperCase(),
                      createElement('div', { className: userStyles.verifiedBadge }, '🛡️')
                    ),
                    createElement('div', null,
                      createElement('div', { style: { marginBottom: '30px' } },
                        createElement('h2', { style: { fontSize: '42px', fontWeight: '900', margin: '0' } }, user?.name || 'User Agent'),
                        createElement('div', { style: { display: 'flex', gap: '15px', marginTop: '8px' } },
                          createElement('span', { style: { color: '#10B981', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' } }, 'VERIFIED USER ●'),
                          createElement('span', { style: { color: '#94A3B8', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' } }, 'ACTIVE SINCE 2024')
                        )
                      ),
                      createElement('div', { className: userStyles.detailsGrid },
                        [
                          { icon: '✉️', label: 'Email Address', value: user?.email || 'N/A' },
                          { icon: '📞', label: 'Phone Number', value: user?.phone || 'N/A' },
                          { icon: '📍', label: 'Current Location', value: user?.address || 'San Francisco, CA' },
                          { icon: '🛡️', label: 'Operational Role', value: user?.role || 'Emergency Responder' }
                        ].map((d, idx) => 
                          createElement('div', { key: idx, className: userStyles.detailItem },
                            createElement('div', { className: userStyles.detailIcon }, d.icon),
                            createElement('div', { className: userStyles.detailContent },
                              createElement('label', null, d.label),
                              createElement('div', { className: userStyles.detailValue }, d.value)
                            )
                          )
                        )
                      )
                    )
                  ),

                  /* Stats Grid */
                  createElement('div', { className: userStyles.statsGrid },
                    [
                      { label: 'Alerts Received', value: '247' },
                      { label: 'Resources Requested', value: '12' },
                      { label: 'Emergency Reports', value: '3' }
                    ].map((s, idx) => 
                      createElement('div', { key: idx, className: userStyles.statCard },
                        createElement('span', { className: userStyles.statValue }, s.value),
                        createElement('span', { className: userStyles.statLabel }, s.label)
                      )
                    )
                  ),

                  /* Account Settings Section */
                  createElement('div', { className: userStyles.settingsSection },
                    createElement('h3', { className: userStyles.settingsGroupTitle }, 'Account Settings'),
                    createElement('div', { className: userStyles.settingsList },
                      [
                        { title: 'Email Notifications', desc: 'Receive real-time alerts and system updates via email.', default: true },
                        { title: 'SMS Alerts', desc: 'Get critical emergency broadcasts directly to your mobile device.', default: true },
                        { title: 'Emergency Contact Updates', desc: 'Share your status automatically with designated contacts.', default: false },
                        { title: 'Location Services', desc: 'Permit AEGIS to track your location for faster response times.', default: true }
                      ].map((s, idx) => 
                        createElement('div', { key: idx, className: userStyles.settingsItem },
                          createElement('div', { className: userStyles.settingsInfo },
                            createElement('h4', null, s.title),
                            createElement('p', null, s.desc)
                          ),
                          createElement('label', { className: userStyles.switch },
                            createElement('input', { type: 'checkbox', defaultChecked: s.default }),
                            createElement('span', { className: userStyles.slider })
                          )
                        )
                      )
                    )
                  )
                )
              ) : (
                /* Profile Edit Form - Also Modernized */
                createElement('div', { className: userStyles.card, style: { padding: '50px' } },
                  createElement('h4', { style: { color: '#10B981', marginBottom: '35px', fontSize: '24px', fontWeight: '800' } }, 'Update Personal Protocol'),
                  createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' } },
                    [
                      { label: 'Full Name', value: editedUser.name, key: 'name' },
                      { label: 'Phone Number', value: editedUser.phone, key: 'phone' },
                      { label: 'Emergency Contact', value: editedUser.emergencyContact, key: 'emergencyContact' },
                      { label: 'Residential Address', value: editedUser.address, key: 'address', type: 'textarea' },
                      { label: 'Medical Conditions', value: editedUser.medicalConditions, key: 'medicalConditions', type: 'textarea' }
                    ].map((field, idx) => 
                      createElement('div', { 
                        key: idx, 
                        className: userStyles.inputGroup, 
                        style: field.type === 'textarea' ? { gridColumn: 'span 2' } : {} 
                      },
                        createElement('label', null, field.label),
                        createElement(field.type === 'textarea' ? 'textarea' : 'input', {
                          rows: field.type === 'textarea' ? 3 : undefined,
                          value: field.value,
                          placeholder: `Enter ${field.label.toLowerCase()}...`,
                          onChange: (e) => setEditedUser({...editedUser, [field.key]: e.target.value}),
                          style: { width: '100%', padding: '15px' }
                        })
                      )
                    )
                  ),
                  createElement('div', { style: { display: 'flex', gap: '20px', marginTop: '40px' } },
                    createElement('button', { 
                      className: userStyles.btn, 
                      style: { padding: '18px 40px', fontSize: '16px' }, 
                      onClick: handleProfileUpdate 
                    }, 'CONFIRM UPDATES'),
                    createElement('button', { 
                      className: userStyles.btn, 
                      style: { background: 'rgba(255,255,255,0.05)', padding: '18px 40px', fontSize: '16px' }, 
                      onClick: () => setIsEditingProfile(false) 
                    }, 'CANCEL')
                  )
                )
              )
            )
          ) : activeSection === 'community' ? (
            createElement(motion.div, { key: 'comm', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('h3', null, '👥 Community Hub'),
              createElement('div', { className: userStyles.grid }, 
                communityReports.length === 0 ? createElement('p', null, 'No active community reports.') :
                communityReports.map((r, i) => createElement('div', { key: i, className: userStyles.card },
                  createElement('h4', null, r.report_type),
                  createElement('p', null, r.description),
                  createElement('p', { style: { fontSize: '0.8em', color: '#888' } }, `Reported on: ${new Date(r.reported_at).toLocaleDateString()}`)
                ))
              )
            )
          ) : activeSection === 'donation' ? (
            createElement(motion.div, { key: 'don', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('div', { style: { marginBottom: '40px' } },
                createElement('h3', { style: { fontSize: '32px', fontWeight: '900', margin: '0' } }, '❤️ Donation & Support'),
                createElement('p', { style: { color: '#94A3B8' } }, 'Your contribution powers global relief efforts and saves lives.')
              ),
              createElement('div', { className: userStyles.grid }, 
                createElement('div', { className: userStyles.card, style: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px' } },
                  createElement('div', { style: { fontSize: '40px' } }, '💳'),
                  createElement('div', null,
                    createElement('h4', { style: { fontSize: '24px', margin: '0 0 10px 0' } }, 'Financial Contribution'),
                    createElement('p', { style: { color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' } }, '100% of your donation goes directly towards emergency food, medicine, and shelter distribution.')
                  ),
                  createElement('button', { className: userStyles.btn, onClick: () => {
                    setDonationForm({ ...donationForm, donor_name: user?.name, donor_email: user?.email });
                    setIsDonationModalOpen(true);
                  }, style: { marginTop: 'auto', background: '#10B981', color: '#000', fontWeight: '800' } }, 'DONATE NOW')
                ),
                createElement('div', { className: userStyles.card, style: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px', border: '1px solid rgba(0, 209, 255, 0.2)' } },
                  createElement('div', { style: { fontSize: '40px' } }, '🤝'),
                  createElement('div', null,
                    createElement('h4', { style: { fontSize: '24px', margin: '0 0 10px 0', color: '#00D1FF' } }, 'Field Volunteer'),
                    createElement('p', { style: { color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' } }, 'Join our frontline response teams. We need medical staff, logisticians, and general support in Sector 7.')
                  ),
                  createElement('button', { className: userStyles.btn, onClick: () => {
                    setVolunteerForm({ ...volunteerForm, volunteer_name: user?.name, volunteer_email: user?.email, volunteer_phone: user?.phone });
                    setIsVolunteerModalOpen(true);
                  }, style: { marginTop: 'auto', background: '#00D1FF', color: '#000', fontWeight: '800' } }, 'ENROLL AS AGENT')
                )
              )
            )
          ) : activeSection === 'recovery' ? (
            createElement(motion.div, { key: 'rec', initial: { opacity: 0 }, animate: { opacity: 1 }, className: userStyles.sectionContent },
              createElement('div', { style: { marginBottom: '40px' } },
                createElement('h3', { style: { fontSize: '32px', fontWeight: '900', margin: '0' } }, '🔧 Recovery & Aid'),
                createElement('p', { style: { color: '#94A3B8' } }, 'Systematic damage assessment and relief fund distribution trackers.')
              ),
              createElement('div', { className: userStyles.grid }, 
                createElement('div', { className: userStyles.card, style: { gridColumn: 'span 2', padding: '40px' } },
                   createElement('h4', { style: { marginBottom: '30px' } }, 'Active Damage Assessments'),
                   createElement('div', { style: { display: 'grid', gap: '30px' } },
                      [
                        { label: 'Residential Property', status: 'In Review', progress: 85, color: '#10B981' },
                        { label: 'Farmland / Crops', status: 'Verified', progress: 100, color: '#00D1FF' },
                        { label: 'Electronics/Goods', status: 'Pending', progress: 20, color: '#F59E0B' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>
                            <span>{item.label}</span>
                            <span style={{ color: item.color }}>{item.status}</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                            <div style={{ width: `${item.progress}%`, height: '100%', background: item.color, borderRadius: '10px' }}></div>
                          </div>
                        </div>
                      ))
                   ),
                   createElement('button', { 
                     className: userStyles.btn, 
                     style: { marginTop: '40px', width: '100%' },
                     onClick: () => setIsDamageModalOpen(true)
                   }, 'SUBMIT NEW DAMAGE REPORT')
                ),
                createElement('div', { className: userStyles.card, style: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(9, 11, 15, 0) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' } },
                  createElement('div', { style: { fontSize: '32px' } }, '🏧'),
                  createElement('h4', { style: { margin: 0, fontSize: '20px' } }, 'Relief Fund Eligibility'),
                  createElement('p', { style: { color: '#94A3B8', fontSize: '13px' } }, 'Based on your reported location, you are currently ELIGIBLE for government flood relief funds up to $2,500.'),
                  createElement('button', { className: userStyles.btn, style: { marginTop: 'auto', background: '#10B981', color: '#000' } }, 'CLAIM FUNDS')
                )
              )
            )
          ) : (
            createElement(motion.div, { key: 'other', initial: { opacity: 0 }, animate: { opacity: 1 } }, 
              createElement('h3', null, 'Coming Soon')
            )
          )
        )
      )
    ),
    /* Donation Modal */
    isDonationModalOpen && createElement('div', { className: userStyles.modalOverlay },
      createElement(motion.div, { 
        initial: { opacity: 0, scale: 0.9 }, 
        animate: { opacity: 1, scale: 1 },
        className: userStyles.modalContent 
      },
        createElement('h3', null, '❤️ Force Contribution'),
        createElement('form', { onSubmit: handleDonationSubmit },
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'DONOR NAME'),
            createElement('input', { 
              type: 'text', 
              required: true,
              value: donationForm.donor_name, 
              onChange: (e) => setDonationForm({...donationForm, donor_name: e.target.value}) 
            })
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'DONATION CATEGORY'),
            createElement('select', { 
              required: true,
              value: donationForm.category || 'financial', 
              onChange: (e) => setDonationForm({...donationForm, category: e.target.value}) 
            },
              createElement('option', { value: 'financial' }, 'Financial Aid'),
              createElement('option', { value: 'medical' }, 'Medical Supplies'),
              createElement('option', { value: 'food' }, 'Emergency Rations'),
              createElement('option', { value: 'other' }, 'Other Resources')
            )
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'CONTRIBUTION AMOUNT / VALUE'),
            createElement('input', { 
              type: 'number', 
              required: true,
              min: '1',
              value: donationForm.amount, 
              onChange: (e) => setDonationForm({...donationForm, amount: e.target.value}) 
            })
          ),
          createElement('div', { style: { display: 'flex', gap: '15px', marginTop: '30px' } },
            createElement('button', { type: 'submit', disabled: isSubmitting, className: userStyles.btn }, 'CONFIRM PAYMENT'),
            createElement('button', { type: 'button', onClick: () => setIsDonationModalOpen(false), className: userStyles.btn, style: { background: '#374151' } }, 'CANCEL')
          )
        )
      )
    ),
    /* Donation Success Popup */
    donationSuccess && createElement('div', { 
      className: userStyles.modalOverlay,
      onClick: () => setDonationSuccess(false)
    },
      createElement(motion.div, {
        initial: { opacity: 0, scale: 0.8, y: 30 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring', stiffness: 300, damping: 25 },
        className: userStyles.modalContent,
        style: { textAlign: 'center', padding: '60px 40px', maxWidth: '420px', border: '1px solid rgba(16, 185, 129, 0.3)' },
        onClick: (e) => e.stopPropagation()
      },
        createElement('div', { style: { fontSize: '64px', marginBottom: '20px', animation: 'pulse 1s ease' } }, '✅'),
        createElement('h2', { style: { fontSize: '28px', fontWeight: '900', color: '#10B981', marginBottom: '10px' } }, 'Payment Confirmed!'),
        createElement('p', { style: { color: '#94A3B8', fontSize: '16px', marginBottom: '8px' } }, 'Your donation of'),
        createElement('div', { style: { fontSize: '48px', fontWeight: '900', color: '#10B981', margin: '10px 0 20px' } }, `₹${Number(lastDonationAmount).toLocaleString()}`),
        createElement('p', { style: { color: '#94A3B8', fontSize: '14px', lineHeight: '1.7', marginBottom: '30px' } }, 'has been successfully recorded and is now visible to the ACMS Command Center. Thank you for your generosity 💚'),
        createElement('button', {
          className: userStyles.btn,
          style: { width: '100%', height: '50px', fontSize: '15px', fontWeight: '800' },
          onClick: () => setDonationSuccess(false)
        }, 'Close ✕')
      )
    ),
    /* Volunteer Modal */
    isVolunteerModalOpen && createElement('div', { className: userStyles.modalOverlay },
      createElement(motion.div, { 
        initial: { opacity: 0, scale: 0.9 }, 
        animate: { opacity: 1, scale: 1 },
        className: userStyles.modalContent 
      },
        createElement('h3', { style: { color: '#00D1FF' } }, '🤝 Agent Enrollment'),
        createElement('form', { onSubmit: handleVolunteerSubmit },
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'AGENT NAME'),
            createElement('input', { 
              type: 'text', 
              required: true,
              value: volunteerForm.volunteer_name, 
              onChange: (e) => setVolunteerForm({...volunteerForm, volunteer_name: e.target.value}) 
            })
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'SPECIALIZATION / AREA OF INTEREST'),
            createElement('select', { 
              required: true,
              value: volunteerForm.areas_of_interest, 
              onChange: (e) => setVolunteerForm({...volunteerForm, areas_of_interest: e.target.value}) 
            },
              createElement('option', { value: '' }, 'Select Skillset'),
              createElement('option', { value: 'Medical Response' }, 'Medical Response'),
              createElement('option', { value: 'Field Logistics' }, 'Field Logistics'),
              createElement('option', { value: 'Rescue Operations' }, 'Rescue Operations'),
              createElement('option', { value: 'Data Analysis' }, 'Data Analysis')
            )
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'DEPLOYMENT DURATION (MONTHS)'),
            createElement('input', { 
              type: 'number', 
              min: '1',
              max: '12',
              value: volunteerForm.duration_months, 
              onChange: (e) => setVolunteerForm({...volunteerForm, duration_months: e.target.value}) 
            })
          ),
          createElement('div', { style: { display: 'flex', gap: '15px', marginTop: '30px' } },
            createElement('button', { type: 'submit', disabled: isSubmitting, className: userStyles.btn, style: { background: '#00D1FF', color: '#000' } }, 'INITIATE ENROLLMENT'),
            createElement('button', { type: 'button', onClick: () => setIsVolunteerModalOpen(false), className: userStyles.btn, style: { background: '#374151' } }, 'CANCEL')
          )
        )
      )
    ),
    /* Damage Report Modal */
    isDamageModalOpen && createElement('div', { className: userStyles.modalOverlay },
      createElement(motion.div, { 
        initial: { opacity: 0, scale: 0.9 }, 
        animate: { opacity: 1, scale: 1 },
        className: userStyles.modalContent 
      },
        createElement('h3', { style: { color: '#F59E0B' } }, '🏗️ Damage Assessment'),
        createElement('form', { onSubmit: handleDamageSubmit },
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'PROPERTY TYPE'),
            createElement('select', { 
              required: true,
              value: damageForm.property_type, 
              onChange: (e) => setDamageForm({...damageForm, property_type: e.target.value}) 
            },
              createElement('option', { value: 'residential' }, 'Residential Property'),
              createElement('option', { value: 'commercial' }, 'Commercial Building'),
              createElement('option', { value: 'agricultural' }, 'Farmland / Crops'),
              createElement('option', { value: 'infrastructure' }, 'Infrastructure / Road'),
              createElement('option', { value: 'other' }, 'Other Asset')
            )
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'LOSS DESCRIPTION'),
            createElement('textarea', { 
              required: true,
              rows: 3,
              style: { color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '15px' },
              placeholder: 'Describe the extent of damage...',
              value: damageForm.description, 
              onChange: (e) => setDamageForm({...damageForm, description: e.target.value}) 
            })
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'ESTIMATED LOSS (₹)'),
            createElement('input', { 
              type: 'number', 
              required: true,
              placeholder: 'Estimated financial impact',
              value: damageForm.estimated_loss, 
              onChange: (e) => setDamageForm({...damageForm, estimated_loss: e.target.value}) 
            })
          ),
          createElement('div', { style: { display: 'flex', gap: '15px', marginTop: '30px' } },
            createElement('button', { type: 'submit', disabled: isSubmitting, className: userStyles.btn, style: { background: '#F59E0B', color: '#000', flex: 1 } }, 'SUBMIT ASSESSMENT'),
            createElement('button', { type: 'button', onClick: () => setIsDamageModalOpen(false), className: userStyles.btn, style: { background: '#374151', flex: 1 } }, 'CANCEL')
          )
        )
      )
    ),
    /* Damage Report Success Popup */
    damageSuccess && createElement('div', { 
      className: userStyles.modalOverlay,
      onClick: () => setDamageSuccess(false)
    },
      createElement(motion.div, {
        initial: { opacity: 0, scale: 0.8, y: 30 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring', stiffness: 300, damping: 25 },
        className: userStyles.modalContent,
        style: { textAlign: 'center', padding: '60px 40px', maxWidth: '420px', border: '1px solid rgba(16, 185, 129, 0.3)' },
        onClick: (e) => e.stopPropagation()
      },
        createElement('div', { style: { fontSize: '64px', marginBottom: '20px', animation: 'pulse 1s ease' } }, '✅'),
        createElement('h2', { style: { fontSize: '26px', fontWeight: '900', color: '#10B981', marginBottom: '10px' } }, 'Assessment Broadcasted!'),
        createElement('p', { style: { color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', marginBottom: '30px' } }, 'Your damage report is now securely logged and visible under the ACMS Command Center Recovery section for verification.'),
        createElement('button', {
          className: userStyles.btn,
          style: { width: '100%', height: '50px', fontSize: '15px', fontWeight: '800' },
          onClick: () => setDamageSuccess(false)
        }, 'Close ✕')
      )
    ),
    /* Resource Request Modal */
    isResourceModalOpen && createElement('div', { className: userStyles.modalOverlay },
      createElement(motion.div, { 
        initial: { opacity: 0, scale: 0.9 }, 
        animate: { opacity: 1, scale: 1 },
        className: userStyles.modalContent 
      },
        createElement('h3', { style: { color: '#10B981' } }, '📦 Resource Requisition'),
        createElement('form', { onSubmit: handleResourceSubmit },
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'RESOURCE'),
            createElement('input', { 
              type: 'text', 
              readOnly: true,
              value: resourceForm.resource_name
            })
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'QUANTITY REQUIRED'),
            createElement('input', { 
              type: 'number', 
              required: true,
              min: '1',
              value: resourceForm.quantity, 
              onChange: (e) => setResourceForm({...resourceForm, quantity: e.target.value}) 
            })
          ),
          createElement('div', { className: userStyles.inputGroup },
            createElement('label', null, 'REASON / URGENCY'),
            createElement('textarea', { 
              rows: 3,
              style: { color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '15px' },
              placeholder: 'Briefly explain the need...',
              value: resourceForm.notes, 
              onChange: (e) => setResourceForm({...resourceForm, notes: e.target.value}) 
            })
          ),
          createElement('div', { style: { display: 'flex', gap: '15px', marginTop: '30px' } },
            createElement('button', { type: 'submit', disabled: isSubmitting, className: userStyles.btn, style: { background: '#10B981', color: '#000', flex: 1 } }, 'SUBMIT REQUEST'),
            createElement('button', { type: 'button', onClick: () => setIsResourceModalOpen(false), className: userStyles.btn, style: { background: '#374151', flex: 1 } }, 'CANCEL')
          )
        )
      )
    )
  );
};

export default UserDashboard;