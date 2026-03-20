import { useRouter } from 'next/router'; // Replace useNavigate with useRouter
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import styles from './adminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement);

const AdminDashboard = () => {
  const router = useRouter(); // Hook for navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [agents, setAgents] = useState([]);
  // Real-time monitor state for charts and thresholds
  const [rainfallSeries, setRainfallSeries] = useState(Array.from({ length: 12 }, () => Math.round(Math.random() * 30)));
  const [waterLevelSeries, setWaterLevelSeries] = useState(Array.from({ length: 12 }, () => Number((3 + Math.random() * 2).toFixed(2))));
  const [temperatureSeries, setTemperatureSeries] = useState(Array.from({ length: 12 }, () => Math.round(20 + Math.random() * 10)));
  const [thresholds, setThresholds] = useState({ rainfall: 150, river: 4.5, humidity: 85, wind: 60 });
  const [weights, setWeights] = useState({ river: 0.6, rainfall: 0.3, temperature: 0.1 });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [footprintData, setFootprintData] = useState({
    electricityKWh: 0,
    carMiles: 0,
    flightsMiles: 0,
    recycling: false,
  });
  const [carbonFootprint, setCarbonFootprint] = useState(0);
  const [systemStatus, setSystemStatus] = useState(null);
  const [monitoringMetrics, setMonitoringMetrics] = useState(null);
  const [floods, setFloods] = useState([]);
  const [selectedFlood, setSelectedFlood] = useState(null);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [floodDetails, setFloodDetails] = useState({});
  const [users, setUsers] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [issueFilter, setIssueFilter] = useState('open');
  const [issueSearch, setIssueSearch] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [donations, setDonations] = useState([]);
  const [itemPickups, setItemPickups] = useState([]);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [financialAidRequests, setFinancialAidRequests] = useState([]);
  const localMockFloods = [
    { 
      id: -1, 
      name: 'Kerala Flood Risk', 
      region: 'Kerala', 
      severity: 'high', 
      status: 'active', 
      prediction_accuracy: 63.72,
      start_time: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    { 
      id: -2, 
      name: 'Assam River Overflow', 
      region: 'Assam', 
      severity: 'moderate', 
      status: 'active', 
      prediction_accuracy: 78.45,
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      last_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    }
  ];

  // Check user role on component mount
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Fetch user data from localStorage
        const user = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored after login
        if (!user) {
          // No user logged in, redirect to login
          showNotification('No user logged in', 'error');
          router.push('/login');
          return;
        }

        // Check if the user has the admin role
        if (user.role !== 'admin') {
          // Redirect non-admin users to the user dashboard
          showNotification('Unauthorized access', 'error');
          router.push('/user');
          return;
        }

        // If user is admin, proceed with initialization
        initializeAdmin();
        startRealTimeUpdates();
        populateAgents();
        populateAlerts();
        fetchInitialData();
        fetchResourceRequests();
        fetchInventory();
        fetchCommunityReports();
        fetchShelters();
        fetchDonations();
        fetchItemPickups();
        fetchVolunteerRequests();
        fetchDamageReports();
        fetchFinancialAid();
      } catch (error) {
        console.error('Error checking user role:', error);
        showNotification('Failed to verify user role', 'error');
        router.push('/login');
      }
    };

    checkUserRole();
  }, [router]); // Update dependency to router

  // Recompute series based on weights to simulate model impact
  const runSimulation = () => {
    const t = Array.from({ length: 12 }, (_, i) => i);
    const mixed = t.map((i) => (
      weights.river * (waterLevelSeries[i] - 2) +
      weights.rainfall * (rainfallSeries[i] / 10) +
      weights.temperature * ((temperatureSeries[i] - 20) / 10)
    ));
    setWaterLevelSeries(prev => prev.map((x, i) => Number((x + mixed[i] * 0.1).toFixed(2))));
    setRainfallSeries(prev => prev.map((x, i) => Math.max(0, Math.round(x + mixed[i] * 2))));
    setTemperatureSeries(prev => prev.map((x, i) => Math.round(x + mixed[i])));
    showNotification('Simulation run using current weights and thresholds', 'success');
  };

  const initializeAdmin = () => {
    document.addEventListener('click', (event) => {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menuToggle');
      if (!sidebar.contains(event.target) && !menuToggle.contains(event.target) && sidebarOpen) {
        toggleSidebar();
      }
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const showSection = (sectionId) => {
    setCurrentSection(sectionId);
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  const refreshData = () => {
    const btn = document.querySelector(`.${styles.refreshBtn}`);
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      btn.style.transform = 'rotate(0deg)';
      populateAlerts();
      updateMetrics();
      fetchInitialData();
      showNotification('Data refreshed successfully!', 'success');
    }, 1000);
  };

  // Function to refresh data when new predictions are made
  const refreshPredictions = () => {
    fetchInitialData();
  };

  // Listen for prediction updates (you can call this from other components)
  useEffect(() => {
    const handlePredictionUpdate = () => {
      refreshPredictions();
    };
    
    // Listen for custom events from prediction components
    window.addEventListener('predictionMade', handlePredictionUpdate);
    
    return () => {
      window.removeEventListener('predictionMade', handlePredictionUpdate);
    };
  }, []);

  // Threshold → series effect handler
  const handleThresholdChange = (key, value) => {
    const v = Number(value);
    setThresholds(prev => ({ ...prev, [key]: v }));
    // Simple, visible change to the last few points to reflect parameter tuning
    if (key === 'rainfall') {
      setRainfallSeries(series => series.map((x, i) => i > 8 ? Math.min(100, Math.round(x * (v / 150))) : x));
    }
    if (key === 'river') {
      setWaterLevelSeries(series => series.map((x, i) => i > 8 ? Number((x * (v / 4.5)).toFixed(2)) : x));
    }
    if (key === 'humidity') {
      setTemperatureSeries(series => series.map((x, i) => i > 8 ? Math.max(0, Math.round(x + (v - 85) / 5)) : x));
    }
    if (key === 'wind') {
      setRainfallSeries(series => series.map((x, i) => i > 8 ? Math.max(0, Math.round(x + (v - 60) / 5)) : x));
    }
  };

  const fetchInitialData = async () => {
    try {
      const [sys, mon, fl, is, an, uc, ul, predictions] = await Promise.all([
        fetch('http://localhost:8000/api/system-status').then(r => r.json()),
        fetch('http://localhost:8000/api/monitoring/metrics').then(r => r.json()),
        fetch('http://localhost:8000/api/floods').then(r => r.json()),
        fetch('http://localhost:8000/api/issues').then(r => r.json()),
        fetch('http://localhost:8000/api/analytics/overview').then(r => r.json()),
        fetch('http://localhost:8000/api/users/count').then(r => r.json()),
        fetch('http://localhost:8000/api/users').then(r => r.json()),
        fetch('http://localhost:8000/api/flood-predictions/history?limit=10').then(r => r.json()).catch(() => ({ data: [] }))
      ]);
      setSystemStatus(sys);
      setMonitoringMetrics(mon);
      const fetched = Array.isArray(fl) ? fl : (fl && Array.isArray(fl.items) ? fl.items : []);
      
      // Convert recent predictions to flood disasters
      const predictionFloods = predictions.data?.map((pred, index) => ({
        id: `pred_${index}`,
        name: `${pred.region} Flood Risk`,
        region: pred.region,
        severity: pred.flood_probability > 0.7 ? 'high' : pred.flood_probability > 0.4 ? 'moderate' : 'low',
        status: 'active',
        prediction_accuracy: pred.confidence * 100,
        start_time: pred.predicted_at,
        last_updated: pred.predicted_at
      })) || [];
      
      setRecentPredictions(predictions.data || []);
      const merged = [...fetched, ...localMockFloods, ...predictionFloods];
      setFloods(merged);
      setIssues(Array.isArray(is) ? is : []);
      setAnalytics(an);
      setUsers(Array.isArray(ul) ? ul : []);
      setUsersCount((uc && typeof uc.count === 'number') ? uc.count : (Array.isArray(ul) ? ul.length : 0));
      const details = {};
      merged.forEach(f => {
        details[f.id] = generateFloodDetails(f);
      });
      setFloodDetails(details);
    } catch (e) {
      console.error(e);
      showNotification('Failed to fetch data from backend', 'warning');
    }
  };

  const generateFloodDetails = (flood) => {
    // Special case for Kerala Flood Risk with specific data
    if (flood.region === 'Kerala' && flood.name === 'Kerala Flood Risk') {
      return {
        rainfall: 54,
        waterLevel: 4.06,
        populationAffected: 41750,
        sheltersOpen: 30,
        resources: {
          boats: 27,
          foodPacks: 3430,
          waterLiters: 5007,
          medKits: 425
        },
        lastUpdated: new Date().toISOString(),
        riskBucket: 'high',
        districts: ['North District', 'South District', 'East District', 'West District']
      };
    }
    
    // For prediction-based floods, use real data from predictions
    if (flood.id && flood.id.toString().startsWith('pred_')) {
      const seed = flood.region.length * 1337; // Use region name as seed
      const rand = (n) => ((Math.sin(n) + 1) / 2);
      const floodProbability = flood.prediction_accuracy / 100;
      
      return {
        rainfall: Math.round(30 + floodProbability * 100), // Based on flood probability
        waterLevel: (2 + floodProbability * 4).toFixed(2),
        populationAffected: Math.round(5000 + floodProbability * 50000),
        sheltersOpen: Math.round(5 + floodProbability * 25),
        resources: {
          boats: Math.round(5 + floodProbability * 30),
          foodPacks: Math.round(1000 + floodProbability * 5000),
          waterLiters: Math.round(2000 + floodProbability * 10000),
          medKits: Math.round(50 + floodProbability * 500)
        },
        lastUpdated: flood.last_updated || new Date().toISOString(),
        riskBucket: flood.severity,
        districts: ['North District', 'South District', 'East District', 'West District']
      };
    }
    
    // For other floods, use random generation
    const seed = (flood.id || 1) * 1337;
    const rand = (n) => ((Math.sin(n) + 1) / 2);
    const rainfall = Math.round(50 + rand(seed) * 250); // mm last 24h
    const waterLevel = (2 + rand(seed + 1) * 6).toFixed(2); // m
    const populationAffected = Math.round(1000 + rand(seed + 2) * 50000);
    const sheltersOpen = Math.round(5 + rand(seed + 3) * 25);
    const resources = {
      boats: Math.round(5 + rand(seed + 4) * 30),
      foodPacks: Math.round(1000 + rand(seed + 5) * 10000),
      waterLiters: Math.round(5000 + rand(seed + 6) * 30000),
      medKits: Math.round(100 + rand(seed + 7) * 1500)
    };
    const lastUpdated = new Date(Date.now() - Math.round(rand(seed + 8) * 3600 * 1000)).toISOString();
    const riskBucket = (flood.severity === 'critical' || rand(seed + 9) > 0.66) ? 'high' : (rand(seed + 10) > 0.33 ? 'moderate' : 'low');
    const districts = [
      'North District','South District','East District','West District','Central District','Riverbank'
    ].slice(0, 3 + Math.floor(rand(seed + 11) * 3));
    return { rainfall, waterLevel, populationAffected, sheltersOpen, resources, lastUpdated, riskBucket, districts };
  };

  const resolveFlood = async (id) => {
    if (id < 0) {
      setFloods(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' } : f));
      showNotification('Flood marked as resolved', 'success');
      return;
    }
    await fetch(`http://localhost:8000/api/floods/${id}/resolve`, { method: 'POST' });
    fetchInitialData();
    showNotification('Flood marked as resolved', 'success');
  };

  const updateFlood = async (flood) => {
    await fetch(`http://localhost:8000/api/floods/${flood.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: flood.name,
        region: flood.region,
        severity: flood.severity,
        status: flood.status,
        prediction_accuracy: flood.prediction_accuracy
      })
    });
    fetchInitialData();
    setSelectedFlood(null);
    showNotification('Flood updated', 'success');
  };

  const resolveIssue = async (id) => {
    await fetch(`http://localhost:8000/api/issues/${id}/resolve`, { method: 'POST' });
    setIssues(prev => Array.isArray(prev) ? prev.filter(x => x.id !== id) : prev);
    showNotification('Issue resolved', 'success');
  };

  const deleteIssue = async (id) => {
    await fetch(`http://localhost:8000/api/issues/${id}`, { method: 'DELETE' });
    setIssues(prev => Array.isArray(prev) ? prev.filter(x => x.id !== id) : prev);
    showNotification('Issue deleted', 'success');
  };

  const updateIssue = async (issue) => {
    await fetch(`http://localhost:8000/api/issues/${issue.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: issue.title, description: issue.description, status: issue.status })
    });
    setSelectedIssue(null);
    fetchInitialData();
    showNotification('Issue updated', 'success');
  };

  const createIssue = async (title, description) => {
    await fetch('http://localhost:8000/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status: 'open' })
    });
    fetchInitialData();
    showNotification('Issue created', 'success');
  };

  const approveFlood = async (id) => {
    if (id < 0) {
      setFloods(prev => prev.map(f => f.id === id ? { ...f, status: 'approved' } : f));
      showNotification('Flood approved', 'success');
      return;
    }
    await fetch(`http://localhost:8000/api/floods/${id}/approve`, { method: 'POST' });
    fetchInitialData();
    showNotification('Flood approved', 'success');
  };

  const deleteFlood = async (id) => {
    if (!confirm('Delete this flood record?')) return;
    if (id < 0) {
      setFloods(prev => prev.filter(f => f.id !== id));
      setSelectedFlood(null);
      showNotification('Flood deleted', 'success');
      return;
    }
    await fetch(`http://localhost:8000/api/floods/${id}`, { method: 'DELETE' });
    fetchInitialData();
    setSelectedFlood(null);
    showNotification('Flood deleted', 'success');
  };

  const handleAgentClick = (agent) => {
    if (agent.redirectTo) {
      router.push(agent.redirectTo);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setUploadedImage(URL.createObjectURL(file));
    
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('http://localhost:8000/api/classify-image', { method: 'POST', body: form });
      const data = await res.json();
      
      // Enhanced analysis with damage assessment
      const analysis = {
        ...data,
        floodDetected: data.label === 'Wildfire' ? false : data.wildfire_confidence < 0.5,
        severity: data.wildfire_confidence < 0.3 ? 'high' : data.wildfire_confidence < 0.6 ? 'moderate' : 'low',
        damageLevel: Math.round((1 - data.wildfire_confidence) * 100),
        affectedArea: Math.round((1 - data.wildfire_confidence) * 50) + '%',
        waterLevel: (2 + (1 - data.wildfire_confidence) * 4).toFixed(2) + 'm',
        riskAssessment: data.wildfire_confidence < 0.3 ? 'Critical - Immediate evacuation recommended' : 
                       data.wildfire_confidence < 0.6 ? 'High - Prepare for evacuation' : 'Low - Monitor situation',
        recommendations: data.wildfire_confidence < 0.3 ? [
          'Immediate evacuation of affected areas',
          'Deploy emergency response teams',
          'Set up temporary shelters',
          'Activate flood warning systems'
        ] : data.wildfire_confidence < 0.6 ? [
          'Prepare evacuation routes',
          'Monitor water levels closely',
          'Alert local authorities',
          'Stock emergency supplies'
        ] : [
          'Continue monitoring',
          'Prepare contingency plans',
          'Maintain normal operations'
        ]
      };
      
      setImageAnalysis(analysis);
      showNotification(`Image analysis complete: ${analysis.floodDetected ? 'Flood detected' : 'No flood detected'} (${analysis.damageLevel}% damage)`, 'info');
    } catch (error) {
      console.error('Image analysis error:', error);
      showNotification('Failed to analyze image', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const populateAgents = () => {
    const agentsData = [
      {
        name: 'Disaster Prediction Agent',
        icon: '🧠',
        status: 'Active - Processing',
        accuracy: '94.2%',
        predictions: '47',
        uptime: '99.8%',
        load: '34%',
        redirectTo: '/disaster-prediction-agent'
      },
      {
        name: 'Monitoring Agent',
        icon: '🛰️',
        status: 'Active - Monitoring',
        accuracy: '97.5%',
        detections: '156',
        uptime: '99.9%',
        load: '28%',
        redirectTo: '/monitoring-agent'
      },
      {
        name: 'Resource Allocation Agent',
        icon: '⚙️',
        status: 'Active - Optimizing',
        accuracy: '96.8%',
        allocations: '89',
        uptime: '99.7%',
        load: '42%',
        redirectTo: '/resource'
      },
      {
        name: 'Recovery Support Agent',
        icon: '🔧',
        status: 'Standby - Ready',
        accuracy: '95.4%',
        plans: '12',
        uptime: '100%',
        load: '15%',
        redirectTo: '/recovery'
      }
    ];
    setAgents(agentsData);
  };

  const populateAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts');
      const data = await res.json();
      const alertsData = (data.data || []).filter(a => !a.acknowledged).map(a => ({
        alert_id: a.alert_id,
        type: a.type,
        icon: a.type === 'error' ? '🚨' : (a.type === 'warning' ? '⚠️' : '✅'),
        title: a.title,
        message: a.message,
        time: new Date(a.time).toLocaleString(),
        acknowledged: a.acknowledged
      }));
      setAlerts(alertsData);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    }
  };
  
  const resolveAlert = async (alertId) => {
    try {
      // Immediately remove from UI for instant feedback
      setAlerts(prevAlerts => prevAlerts.filter(a => a.alert_id !== alertId));
      
      // Then call backend
      await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, { method: 'POST' });
      showNotification('Alert resolved', 'success');
    } catch (e) {
      showNotification('Failed to resolve alert', 'error');
      // Refresh alerts to restore state if backend call failed
      populateAlerts();
    }
  };

  const fetchResourceRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/resource-requests?status=pending');
      const data = await res.json();
      setResourceRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch resource requests:', e);
    }
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

  const approveRequest = async (requestId) => {
    try {
      const resp = await fetch(`http://localhost:8000/api/resource-requests/${requestId}/approve`, { method: 'POST' });
      if (resp.ok) {
        showNotification('Request approved', 'success');
        fetchResourceRequests();
        fetchInventory();
      } else {
        const data = await resp.json();
        showNotification(data.detail || 'Failed to approve', 'error');
      }
    } catch (e) {
      showNotification('Failed to approve request', 'error');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await fetch(`http://localhost:8000/api/resource-requests/${requestId}/reject`, { method: 'POST' });
      showNotification('Request rejected', 'success');
      fetchResourceRequests();
    } catch (e) {
      showNotification('Failed to reject request', 'error');
    }
  };

  const fetchCommunityReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/community-reports');
      const data = await res.json();
      setCommunityReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch community reports:', e);
    }
  };

  const resolveReport = async (reportId) => {
    try {
      await fetch(`http://localhost:8000/api/community-reports/${reportId}/resolve`, { method: 'POST' });
      showNotification('Report resolved', 'success');
      fetchCommunityReports();
    } catch (e) {
      showNotification('Failed to resolve report', 'error');
    }
  };

  const investigateReport = async (reportId) => {
    try {
      await fetch(`http://localhost:8000/api/community-reports/${reportId}/investigate`, { method: 'POST' });
      showNotification('Report marked as investigating', 'info');
      fetchCommunityReports();
    } catch (e) {
      showNotification('Failed to update report', 'error');
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

  const createShelter = async (name, capacity, region) => {
    if (!name || !capacity || !region) {
      showNotification('Please fill all fields', 'warning');
      return false;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/shelters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          capacity: parseInt(capacity),
          assigned_region: region,
          beds_available: parseInt(capacity)
        })
      });
      if (resp.ok) {
        showNotification('Shelter created successfully', 'success');
        fetchShelters();
        return true;
      } else {
        showNotification('Failed to create shelter', 'error');
        return false;
      }
    } catch (e) {
      showNotification('Failed to create shelter', 'error');
      return false;
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/donations');
      const data = await res.json();
      setDonations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch donations:', e);
    }
  };

  const acceptDonation = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/donations/${id}/accept`, { method: 'POST' });
      showNotification('Donation accepted', 'success');
      fetchDonations();
    } catch (e) {
      showNotification('Failed to accept donation', 'error');
    }
  };

  const rejectDonation = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/donations/${id}/reject`, { method: 'POST' });
      showNotification('Donation rejected', 'success');
      fetchDonations();
    } catch (e) {
      showNotification('Failed to reject donation', 'error');
    }
  };

  const fetchItemPickups = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/item-pickups');
      const data = await res.json();
      setItemPickups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch pickups:', e);
    }
  };

  const schedulePickup = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/item-pickups/${id}/schedule`, { method: 'POST' });
      showNotification('Pickup scheduled', 'success');
      fetchItemPickups();
    } catch (e) {
      showNotification('Failed to schedule pickup', 'error');
    }
  };

  const rejectPickup = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/item-pickups/${id}/reject`, { method: 'POST' });
      showNotification('Pickup rejected', 'success');
      fetchItemPickups();
    } catch (e) {
      showNotification('Failed to reject pickup', 'error');
    }
  };

  const fetchVolunteerRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/volunteer-requests');
      const data = await res.json();
      setVolunteerRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch volunteers:', e);
    }
  };

  const acceptVolunteer = async (id, duration) => {
    try {
      await fetch(`http://localhost:8000/api/volunteer-requests/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration })
      });
      showNotification('Volunteer accepted', 'success');
      fetchVolunteerRequests();
    } catch (e) {
      showNotification('Failed to accept volunteer', 'error');
    }
  };

  const rejectVolunteer = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/volunteer-requests/${id}/reject`, { method: 'POST' });
      showNotification('Volunteer rejected', 'success');
      fetchVolunteerRequests();
    } catch (e) {
      showNotification('Failed to reject volunteer', 'error');
    }
  };

  const fetchDamageReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/damage-reports');
      const data = await res.json();
      setDamageReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch damage reports:', e);
    }
  };

  const approveDamageReport = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/damage-reports/${id}/approve`, { method: 'POST' });
      showNotification('Damage report approved', 'success');
      fetchDamageReports();
    } catch (e) {
      showNotification('Failed to approve report', 'error');
    }
  };

  const rejectDamageReport = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/damage-reports/${id}/reject`, { method: 'POST' });
      showNotification('Damage report rejected', 'success');
      fetchDamageReports();
    } catch (e) {
      showNotification('Failed to reject report', 'error');
    }
  };

  const fetchFinancialAid = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/financial-aid');
      const data = await res.json();
      setFinancialAidRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch financial aid:', e);
    }
  };

  const approveFinancialAid = async (id, amount) => {
    try {
      await fetch(`http://localhost:8000/api/financial-aid/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_amount: amount })
      });
      showNotification('Financial aid approved', 'success');
      fetchFinancialAid();
    } catch (e) {
      showNotification('Failed to approve aid', 'error');
    }
  };

  const rejectFinancialAid = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/financial-aid/${id}/reject`, { method: 'POST' });
      showNotification('Financial aid rejected', 'success');
      fetchFinancialAid();
    } catch (e) {
      showNotification('Failed to reject aid', 'error');
    }
  };

  const updateMetrics = () => {
    const uptimeElement = document.querySelector(`.${styles.metricValue}`);
    if (uptimeElement) {
      const currentUptime = parseFloat(uptimeElement.textContent);
      const newUptime = (currentUptime + (Math.random() * 0.2 - 0.1)).toFixed(1);
      if (newUptime <= 100 && newUptime >= 95) {
        uptimeElement.textContent = newUptime + '%';
      }
    }
  };

  const startRealTimeUpdates = () => {
    const interval = setInterval(() => {
      updateMetrics();
      if (Math.random() < 0.1) {
        addRandomAlert();
      }
    }, 5000);
    return () => clearInterval(interval);
  };

  const addRandomAlert = () => {
    const randomAlerts = [
      {
        type: 'warning',
        icon: '⚡',
        title: 'Power Grid Anomaly Detected',
        message: 'Unusual power consumption pattern detected in grid sector 4.',
        time: 'Just now'
      },
      {
        type: 'success',
        icon: '🎯',
        title: 'Resource Deployment Complete',
        message: 'Emergency supplies successfully deployed to affected area.',
        time: 'Just now'
      },
      {
        type: 'warning',
        icon: '🌡️',
        title: 'Temperature Spike Detected',
        message: 'Abnormal temperature readings from sensor network zone 3.',
        time: 'Just now'
      }
    ];
    const randomAlert = randomAlerts[Math.floor(Math.random() * randomAlerts.length)];
    setAlerts(prevAlerts => {
      const newAlerts = [randomAlert, ...prevAlerts].slice(0, 10);
      return newAlerts;
    });
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `alert ${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '90px';
    notification.style.right = '20px';
    notification.style.zIndex = '1001';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
      <div class="alert-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
      <div class="alert-content">
        <div class="alert-title">System Notification</div>
        <div class="alert-message">${message}</div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const logout = () => {
    if (confirm('Are you sure you want to logout?')) {
      showNotification('Logging out...', 'info');
      localStorage.removeItem('user'); // Clear user data
      setTimeout(() => {
        router.push('/login'); // Use router.push for logout
      }, 1500);
    }
  };

  const emergencyOverride = (agentName) => {
    if (confirm(`Are you sure you want to override ${agentName}? This action requires supervisor approval.`)) {
      showNotification(`Emergency override activated for ${agentName}`, 'warning');
    }
  };

  const systemShutdown = () => {
    if (confirm('CRITICAL: Are you sure you want to initiate system shutdown? This will affect all monitoring capabilities.')) {
      const confirmShutdown = prompt('Type "SHUTDOWN" to confirm:');
      if (confirmShutdown === 'SHUTDOWN') {
        showNotification('System shutdown initiated. All agents will be safely terminated.', 'error');
      }
    }
  };

  const exportSystemLogs = () => {
    showNotification('Exporting system logs...', 'info');
    setTimeout(() => {
      const data = {
        timestamp: new Date().toISOString(),
        systemStatus: 'operational',
        activeAgents: 6,
        alerts: document.querySelectorAll('.alert').length,
        uptime: '99.8%'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acdms_logs_${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('System logs exported successfully!', 'success');
    }, 2000);
  };

  const quickActions = {
    activateEmergencyMode: () => {
      showNotification('Emergency mode activated. All agents switched to high-priority operations.', 'warning');
    },
    runSystemDiagnostics: () => {
      showNotification('Running full system diagnostics...', 'info');
      setTimeout(() => {
        showNotification('System diagnostics complete. All systems operational.', 'success');
      }, 3000);
    },
    updateAllAgents: () => {
      showNotification('Updating all AI agents with latest models...', 'info');
      setTimeout(() => {
        showNotification('All agents updated successfully. Performance improved by 3.2%.', 'success');
        populateAgents();
      }, 4000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFootprintData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value) || 0,
    }));
  };

  const calculateFootprint = () => {
    // Approximate emission factors (kg CO2e)
    const electricityFactor = 0.85; // kg CO2e per kWh
    const carFactor = 0.4; // kg CO2e per mile
    const flightFactor = 0.15; // kg CO2e per mile
    const recyclingReduction = 50; // kg CO2e reduction if recycling

    let total = 0;
    total += footprintData.electricityKWh * electricityFactor;
    total += footprintData.carMiles * carFactor;
    total += footprintData.flightsMiles * flightFactor;
    if (footprintData.recycling) {
      total -= recyclingReduction;
    }
    setCarbonFootprint(total > 0 ? total : 0);
    showNotification('Carbon footprint calculated!', 'success');
  };

  return (
    <div className={styles.body}>
      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <button className={styles.menuToggle} id="menuToggle" onClick={toggleSidebar}>☰</button>
          <div className={styles.navbarBrand}>
            <span>🌱</span>
            <span>ACDMS Admin</span>
          </div>
        </div>
        <div className={styles.navbarRight}>
          <a href="#" className={styles.navBtn} onClick={() => showSection('home')}>🏠 Home</a>
          <a href="#" className={styles.navBtn} onClick={() => showSection('weather')}>🌤️ Weather</a>
          <a href="#" className={styles.navBtn} onClick={() => showSection('footprint')}>🌍 Footprint</a>
          <a href="#" className={`${styles.navBtn} ${styles.logout}`} onClick={logout}>🚪 Logout</a>
        </div>
      </nav>

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.active : ''}`} id="sidebar">
        <nav className={styles.sidebarMenu}>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'dashboard' ? styles.active : ''}`} onClick={() => showSection('dashboard')}>
              <span className={styles.menuIcon}>📊</span>
              <span className={styles.menuText}>Dashboard</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'agents' ? styles.active : ''}`} onClick={() => showSection('agents')}>
              <span className={styles.menuIcon}>🤖</span>
              <span className={styles.menuText}>AI Agents</span>
              <span className={`${styles.menuBadge} ${styles.success}`}>6</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'disasters' ? styles.active : ''}`} onClick={() => showSection('disasters')}>
              <span className={styles.menuIcon}>🚨</span>
              <span className={styles.menuText}>Active Disasters</span>
              <span className={styles.menuBadge}>3</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'monitoring' ? styles.active : ''}`} onClick={() => showSection('monitoring')}>
              <span className={styles.menuIcon}>📡</span>
              <span className={styles.menuText}>Real-time Monitor</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'resources' ? styles.active : ''}`} onClick={() => showSection('resources')}>
              <span className={styles.menuIcon}>🎯</span>
              <span className={styles.menuText}>Resource Allocation</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'evacuation' ? styles.active : ''}`} onClick={() => showSection('evacuation')}>
              <span className={styles.menuIcon}>🚁</span>
              <span className={styles.menuText}>Evacuation Plans</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'users' ? styles.active : ''}`} onClick={() => showSection('users')}>
              <span className={styles.menuIcon}>👥</span>
              <span className={styles.menuText}>User Management</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'issues' ? styles.active : ''}`} onClick={() => showSection('issues')}>
              <span className={styles.menuIcon}>🔧</span>
              <span className={styles.menuText}>Issues & Support</span>
              <span className={`${styles.menuBadge} ${styles.warning}`}>12</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'funding' ? styles.active : ''}`} onClick={() => showSection('funding')}>
              <span className={styles.menuIcon}>💰</span>
              <span className={styles.menuText}>Funding & Volunteers</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'recovery' ? styles.active : ''}`} onClick={() => showSection('recovery')}>
              <span className={styles.menuIcon}>🏗️</span>
              <span className={styles.menuText}>Recovery Reports</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'analytics' ? styles.active : ''}`} onClick={() => showSection('analytics')}>
              <span className={styles.menuIcon}>📈</span>
              <span className={styles.menuText}>Analytics</span>
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'settings' ? styles.active : ''}`} onClick={() => showSection('settings')}>
              <span className={styles.menuIcon}>⚙️</span>
              <span className={styles.menuText}>System Settings</span>
            </a>
          </div>
        </nav>
      </aside>

      <main className={`${styles.mainContent} ${sidebarOpen ? styles.active : ''}`}>
        <div id="dashboard" className={`${styles.contentSection} ${currentSection === 'dashboard' ? styles.active : ''}`}>
          <div className={styles.dashboardHeader}>
            <h1 className={styles.dashboardTitle}>System Overview</h1>
            <button className={styles.refreshBtn} onClick={refreshData}>🔄 Refresh Data</button>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>System Status</h3>
                <span className={styles.cardIcon}>⚡</span>
              </div>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${styles.online}`}></div>
                <span>{systemStatus ? 'All Services Operational' : 'Loading...'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Uptime</span>
                <span className={styles.metricValue}>{systemStatus ? `${(systemStatus.uptime_seconds/3600).toFixed(1)}h` : '...'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>CPU Usage</span>
                <span className={styles.metricValue}>{systemStatus ? `${systemStatus.cpu_percent}%` : '...'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Memory</span>
                <span className={styles.metricValue}>{systemStatus ? `${systemStatus.memory_used_gb}GB / ${systemStatus.memory_total_gb}GB` : '...'}</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Active Monitoring</h3>
                <span className={styles.cardIcon}>📡</span>
              </div>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${styles.online}`}></div>
                <span>Real-time Data Flow</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Satellites</span>
                <span className={styles.metricValue}>{monitoringMetrics ? `${monitoringMetrics.satellites_active} Active` : '...'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Weather Stations</span>
                <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.weather_stations : '...'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Data Points/min</span>
                <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.datapoints_per_min : '...'}</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Risk Assessment</h3>
                <span className={styles.cardIcon}>⚠️</span>
              </div>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${styles.warning}`}></div>
                <span>Moderate Risk Detected</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>High Risk Areas</span>
                <span className={styles.metricValue}>3</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Active Predictions</span>
                <span className={styles.metricValue}>47</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Accuracy</span>
                <span className={styles.metricValue}>94.2%</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Response Status</h3>
                <span className={styles.cardIcon}>🚨</span>
              </div>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${styles.online}`}></div>
                <span>Response Teams Ready</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Available Units</span>
                <span className={styles.metricValue}>89</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Deployed</span>
                <span className={styles.metricValue}>23</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Response Time</span>
                <span className={styles.metricValue}>4.2 min</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Live System Alerts</h3>
              <span className={styles.cardIcon}>🔔</span>
            </div>
            <div className={styles.alertsContainer} id="alertsContainer">
              {alerts.map((alert, index) => (
                <div key={index} className={`${styles.alert} ${styles[alert.type]}`} style={alert.type === 'error' ? { backgroundColor: '#dc2626', borderLeft: '4px solid #991b1b', color: 'white' } : {}}>
                  <div className={styles.alertIcon}>{alert.icon}</div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertTitle} style={alert.type === 'error' ? { color: '#fca5a5', fontWeight: 'bold', fontSize: '16px' } : {}}>{alert.title}</div>
                    <div className={styles.alertMessage} style={alert.type === 'error' ? { color: 'white' } : {}}>{alert.message}</div>
                    <div className={styles.alertTime} style={alert.type === 'error' ? { color: '#fecaca' } : {}}>{alert.time}</div>
                  </div>
                  {alert.alert_id && (
                    <button 
                      onClick={() => resolveAlert(alert.alert_id)}
                      style={{
                        marginLeft: 'auto',
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="agents" className={`${styles.contentSection} ${currentSection === 'agents' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>AI Agent Status</h2>
          <div className={styles.agentsGrid} id="agentsGrid">
            {agents.map((agent, index) => {
              const statusClass = agent.status.includes('Active') ? 'online' :
                                agent.status.includes('Warning') ? 'warning' : 'offline';
              return (
                <div key={index} className={`${styles.agentCard} ${styles.clickable}`} onClick={() => handleAgentClick(agent)}>
                  <div className={styles.agentHeader}>
                    <div className={styles.agentIcon}>{agent.icon}</div>
                    <div className={styles.agentInfo}>
                      <h3>{agent.name}</h3>
                      <div className={styles.agentStatus}>
                        <div className={styles.statusIndicator}>
                          <div className={`${styles.statusDot} ${styles[statusClass]}`}></div>
                          <span>{agent.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.agentMetrics}>
                    <div className={styles.miniMetric}>
                      <div className={styles.miniMetricValue}>{agent.accuracy}</div>
                      <div className={styles.miniMetricLabel}>Accuracy</div>
                    </div>
                    <div className={styles.miniMetric}>
                      <div className={styles.miniMetricValue}>{agent.predictions || agent.detections || agent.allocations || agent.routes || agent.plans || agent.scenarios}</div>
                      <div className={styles.miniMetricLabel}>Active</div>
                    </div>
                    <div className={styles.miniMetric}>
                      <div className={styles.miniMetricValue}>{agent.uptime}</div>
                      <div className={styles.miniMetricLabel}>Uptime</div>
                    </div>
                    <div className={styles.miniMetric}>
                      <div className={styles.miniMetricValue}>{agent.load}</div>
                      <div className={styles.miniMetricLabel}>Load</div>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: agent.load }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="disasters" className={`${styles.contentSection} ${currentSection === 'disasters' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Active Floods</h2>
          <div className={styles.card}>
            <h3 style={{fontSize:'20px',fontWeight:'bold',marginBottom:'20px'}}>Floods by Region</h3>
            {!Array.isArray(floods) || floods.length === 0 ? <p>No active floods</p> : (
              <div>
                {Array.isArray(floods) && floods.map(f => (
                  <div key={f.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:'18px',marginBottom:'8px'}}>{f.name}</div>
                      <div className={`${styles[`severity${f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}`] || styles.severityModerate}`} style={{marginBottom:'8px'}}>
                        {f.severity}
                      </div>
                      <div style={{opacity:0.8,fontSize:'12px'}}>Region: {f.region} • Status: {f.status} • Accuracy: {f.prediction_accuracy ?? 'N/A'}%</div>
                      <div style={{marginTop:'8px',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'8px'}}>
                        <div className={styles.miniMetric} style={{textAlign:'left'}}>
                          <div className={styles.miniMetricLabel}>Rainfall (24h)</div>
                          <div className={styles.miniMetricValue}>{floodDetails[f.id]?.rainfall ?? '…'} mm</div>
                        </div>
                        <div className={styles.miniMetric} style={{textAlign:'left'}}>
                          <div className={styles.miniMetricLabel}>Water Level</div>
                          <div className={styles.miniMetricValue}>{floodDetails[f.id]?.waterLevel ?? '…'} m</div>
                        </div>
                        <div className={styles.miniMetric} style={{textAlign:'left'}}>
                          <div className={styles.miniMetricLabel}>Affected Population</div>
                          <div className={styles.miniMetricValue}>{floodDetails[f.id]?.populationAffected?.toLocaleString?.() ?? '…'}</div>
                        </div>
                        <div className={styles.miniMetric} style={{textAlign:'left'}}>
                          <div className={styles.miniMetricLabel}>Shelters Open</div>
                          <div className={styles.miniMetricValue}>{floodDetails[f.id]?.sheltersOpen ?? '…'}</div>
                        </div>
                      </div>
                      <div style={{marginTop:'8px',opacity:0.85,fontSize:'12px'}}>
                        Resources → Boats: {floodDetails[f.id]?.resources?.boats ?? '…'}, Food Packs: {floodDetails[f.id]?.resources?.foodPacks ?? '…'}, Water (L): {floodDetails[f.id]?.resources?.waterLiters ?? '…'}, Med Kits: {floodDetails[f.id]?.resources?.medKits ?? '…'}
                      </div>
                      <div style={{marginTop:'6px',opacity:0.75,fontSize:'12px'}}>Districts: {(floodDetails[f.id]?.districts || []).join(', ')}</div>
                      <div style={{marginTop:'4px',opacity:0.65,fontSize:'12px'}}>Risk Bucket: {floodDetails[f.id]?.riskBucket || '…'} • Updated: {floodDetails[f.id]?.lastUpdated ? new Date(floodDetails[f.id].lastUpdated).toLocaleString() : '…'}</div>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button className={styles.refreshBtn} onClick={() => setSelectedFlood(f)}>View/Edit</button>
                      {f.status !== 'approved' && <button className={styles.refreshBtn} onClick={() => approveFlood(f.id)}>Approve</button>}
                      {f.status !== 'resolved' && <button className={styles.refreshBtn} onClick={() => resolveFlood(f.id)}>Resolve</button>}
                      <button className={styles.refreshBtn} onClick={() => deleteFlood(f.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedFlood && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1002}}>
              <div className={styles.card} style={{width:'600px'}}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Flood Details</h3>
                  <span className={styles.cardIcon} onClick={() => setSelectedFlood(null)} style={{cursor:'pointer'}}>✖</span>
                </div>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input value={selectedFlood.name} onChange={e => setSelectedFlood({...selectedFlood, name:e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Region</label>
                  <input value={selectedFlood.region} onChange={e => setSelectedFlood({...selectedFlood, region:e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Severity</label>
                  <input value={selectedFlood.severity} onChange={e => setSelectedFlood({...selectedFlood, severity:e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <input value={selectedFlood.status} onChange={e => setSelectedFlood({...selectedFlood, status:e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Prediction Accuracy</label>
                  <input type="number" value={selectedFlood.prediction_accuracy || ''} onChange={e => setSelectedFlood({...selectedFlood, prediction_accuracy: Number(e.target.value)})} />
                </div>
                <div className={styles.metric}><span className={styles.metricLabel}>Started</span><span className={styles.metricValue}>{selectedFlood.start_time ? new Date(selectedFlood.start_time).toLocaleString() : 'N/A'}</span></div>
                <div className={styles.metric}><span className={styles.metricLabel}>Ended</span><span className={styles.metricValue}>{selectedFlood.end_time ? new Date(selectedFlood.end_time).toLocaleString() : '-'}</span></div>
                <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
                  <button className={styles.refreshBtn} onClick={() => updateFlood(selectedFlood)}>Save</button>
                  {selectedFlood.status !== 'approved' && <button className={styles.refreshBtn} onClick={() => approveFlood(selectedFlood.id)}>Approve</button>}
                  <button className={styles.refreshBtn} onClick={() => setSelectedFlood(null)}>Cancel</button>
                  <button className={styles.refreshBtn} onClick={() => deleteFlood(selectedFlood.id)}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="monitoring" className={`${styles.contentSection} ${currentSection === 'monitoring' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Real-time Monitoring</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Satellite Feeds</h3>
              <span className={styles.cardIcon}>🛰️</span>
            </div>
            <div className={styles.metric}><span className={styles.metricLabel}>Active Feeds</span><span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.satellites_active : '...'}</span></div>
            <div style={{display:'flex',gap:'10px',margin:'10px 0'}}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Switched to backup satellite feed', 'success')}>Switch to Backup</button>
              <button className={styles.refreshBtn} onClick={() => createIssue('Satellite feed offline', 'Region: Unspecified; Feed: GOES-16; Auto-raised by monitoring')}>Raise Support Ticket</button>
            </div>
            <div className={styles.formGroup}>
              <label>Upload Satellite Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing} />
              {isAnalyzing && <div style={{color:'#00ff88',marginTop:'5px'}}>🔄 Analyzing image...</div>}
            </div>
            
            {uploadedImage && (
              <div style={{marginTop:'20px'}}>
                <h4>Uploaded Satellite Image</h4>
                <div style={{textAlign:'center',marginBottom:'20px'}}>
                  <img src={uploadedImage} alt="Uploaded satellite image" style={{
                    maxWidth:'100%',
                    maxHeight:'400px',
                    border:'2px solid rgba(0,255,136,0.3)',
                    borderRadius:'8px',
                    boxShadow:'0 4px 15px rgba(0,255,136,0.2)'
              }} />
            </div>
              </div>
            )}
            
            {imageAnalysis && (
              <div style={{marginTop:'20px'}}>
                <h4>Flood Analysis Results</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'20px',marginTop:'15px'}}>
                  <div className={styles.card} style={{padding:'15px'}}>
                    <h5 style={{color:'#00ff88',marginBottom:'10px'}}>Detection Results</h5>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Flood Detected:</span>
                      <span style={{color:imageAnalysis.floodDetected ? '#ff4444' : '#44ff44',fontWeight:'bold'}}>
                        {imageAnalysis.floodDetected ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Confidence:</span>
                      <span style={{color:'#00d4ff'}}>{(imageAnalysis.confidence).toFixed(1)}%</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Severity:</span>
                      <span style={{
                        color: imageAnalysis.severity === 'high' ? '#ff4444' : 
                               imageAnalysis.severity === 'moderate' ? '#ffaa00' : '#44ff44',
                        fontWeight:'bold',
                        textTransform:'uppercase'
                      }}>
                        {imageAnalysis.severity}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.card} style={{padding:'15px'}}>
                    <h5 style={{color:'#00ff88',marginBottom:'10px'}}>Damage Assessment</h5>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Damage Level:</span>
                      <span style={{color:'#ff4444',fontWeight:'bold'}}>{imageAnalysis.damageLevel}%</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Affected Area:</span>
                      <span style={{color:'#ffaa00'}}>{imageAnalysis.affectedArea}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span>Water Level:</span>
                      <span style={{color:'#00d4ff'}}>{imageAnalysis.waterLevel}</span>
                    </div>
                  </div>
                  
                  <div className={styles.card} style={{padding:'15px',gridColumn:'span 2'}}>
                    <h5 style={{color:'#00ff88',marginBottom:'10px'}}>Risk Assessment & Recommendations</h5>
                    <div style={{marginBottom:'10px'}}>
                      <strong>Assessment:</strong> <span style={{color:'#ffaa00'}}>{imageAnalysis.riskAssessment}</span>
                    </div>
                    <div>
                      <strong>Recommended Actions:</strong>
                      <ul style={{marginTop:'8px',paddingLeft:'20px'}}>
                        {imageAnalysis.recommendations.map((rec, index) => (
                          <li key={index} style={{marginBottom:'4px',color:'#ccc'}}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{marginTop:'20px'}}>
              <h4>Before/After Comparison</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div style={{background:'rgba(255,255,255,0.05)',height:'200px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px'}}>
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Before" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'cover',borderRadius:'4px'}} />
                  ) : (
                    <span style={{color:'#666'}}>Before Image</span>
                  )}
                </div>
                <div style={{background:'rgba(255,255,255,0.05)',height:'200px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px'}}>
                  <span style={{color:'#666'}}>After Image (Historical)</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Weather Station Data</h3>
              <span className={styles.cardIcon}>🌦️</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'16px'}}>
              <div>
                <h4>Rainfall (mm/hr)</h4>
                <Line data={{
                  labels: Array.from({length: 12}, (_, i) => `${i*5}m`),
                  datasets: [{ label: 'Rainfall', data: rainfallSeries, borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.2)' }]
                }} options={{ responsive:true, plugins:{legend:{display:false}} }} />
              </div>
              <div>
                <h4>River Water Level (m)</h4>
                <Line data={{
                  labels: Array.from({length: 12}, (_, i) => `${i*5}m`),
                  datasets: [{ label: 'Water Level', data: waterLevelSeries, borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.2)' }]
                }} options={{ responsive:true, plugins:{legend:{display:false}} }} />
              </div>
              <div>
                <h4>Temperature (°C)</h4>
                <Line data={{
                  labels: Array.from({length: 12}, (_, i) => `${i*5}m`),
                  datasets: [{ label: 'Temperature', data: temperatureSeries, borderColor: '#ffa726', backgroundColor: 'rgba(255,167,38,0.2)' }]
                }} options={{ responsive:true, plugins:{legend:{display:false}} }} />
              </div>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Stations Reporting</span>
              <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.weather_stations : '...'}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px',marginTop:'10px'}}>
              <div className={styles.formGroup}><label>Rainfall Threshold (24h, mm)</label><input value={thresholds.rainfall} onChange={(e)=>handleThresholdChange('rainfall', e.target.value)} type="number" /></div>
              <div className={styles.formGroup}><label>River Level Threshold (m)</label><input value={thresholds.river} onChange={(e)=>handleThresholdChange('river', e.target.value)} type="number" /></div>
              <div className={styles.formGroup}><label>Humidity Threshold (%)</label><input value={thresholds.humidity} onChange={(e)=>handleThresholdChange('humidity', e.target.value)} type="number" /></div>
              <div className={styles.formGroup}><label>Wind Speed Threshold (km/h)</label><input value={thresholds.wind} onChange={(e)=>handleThresholdChange('wind', e.target.value)} type="number" /></div>
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Anomaly detection run complete', 'info')}>Detect Anomalies</button>
              <button className={styles.refreshBtn} onClick={() => createIssue('Station reporting no data', 'Region: Unspecified; Station: WX-102; Auto-flagged')}>Flag Station</button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Data Ingestion & Model Integration</h3>
              <span className={styles.cardIcon}>🔗</span>
            </div>
            <div className={styles.metric}><span className={styles.metricLabel}>Data points/min</span><span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.datapoints_per_min : '...'}</span></div>
            <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
              <button className={styles.refreshBtn} onClick={refreshData}>Manual Refresh</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Force sync triggered', 'info')}>Force Sync</button>
            </div>
            <div style={{marginTop:'12px'}}>
              <h4>Model Weighting (mock)</h4>
              <div className={styles.formGroup}><label>River Level Weight</label><input type="range" min="0" max="1" step="0.05" value={weights.river} onChange={(e)=>setWeights(w=>({...w, river: Number(e.target.value)}))} /></div>
              <div className={styles.formGroup}><label>Rainfall Weight</label><input type="range" min="0" max="1" step="0.05" value={weights.rainfall} onChange={(e)=>setWeights(w=>({...w, rainfall: Number(e.target.value)}))} /></div>
              <div className={styles.formGroup}><label>Temperature Weight</label><input type="range" min="0" max="1" step="0.05" value={weights.temperature} onChange={(e)=>setWeights(w=>({...w, temperature: Number(e.target.value)}))} /></div>
              <button className={styles.refreshBtn} onClick={runSimulation}>Run Simulation</button>
            </div>
            <div style={{marginTop:'12px'}}>
              <h4>Alert Management (From Recent Predictions)</h4>
              {recentPredictions && recentPredictions.length > 0 ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:'10px'}}>
                  {recentPredictions.map((p, idx) => {
                    const risk = p.flood_probability > 0.7 ? 'high' : p.flood_probability > 0.4 ? 'moderate' : 'low';
                    const color = risk === 'high' ? '#ff4d4f' : risk === 'moderate' ? '#3b82f6' : '#10b981';
                    const sendAlertForPrediction = async () => {
                      try {
                        const res = await fetch('http://localhost:8000/api/alerts/send', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: `${risk.toUpperCase()} RISK - ${p.region}`,
                            message: `Flood probability ${(p.flood_probability*100).toFixed(0)}% | Confidence ${(p.confidence*100).toFixed(0)}%`,
                            risk
                          })
                        });
                        if (!res.ok) throw new Error('Failed');
                        showNotification('Alert sent to users', risk === 'high' ? 'error' : risk === 'moderate' ? 'warning' : 'success');
                      } catch (e) {
                        console.error(e);
                        showNotification('Failed to send alert', 'error');
                      }
                    };
                    return (
                      <div key={idx} style={{border:`1px solid ${color}55`,padding:'10px',borderRadius:'8px'}}>
                        <div style={{fontWeight:600, color}}>{p.region} • {risk.toUpperCase()}</div>
                        <div style={{fontSize:'12px',opacity:0.85}}>Prob: {(p.flood_probability*100).toFixed(0)}% • Conf: {(p.confidence*100).toFixed(0)}%</div>
                        <button className={styles.refreshBtn} style={{marginTop:'8px'}} onClick={sendAlertForPrediction}>Send Alert</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{opacity:0.8}}>No recent predictions yet.</div>
              )}
            </div>
          </div>
        </div>

        <div id="resources" className={`${styles.contentSection} ${currentSection === 'resources' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Resource Allocation</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Inventory</h3>
              <span className={styles.cardIcon}>📦</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'12px'}}>
              {inventory.length === 0 ? (
                <div style={{gridColumn:'1/-1',padding:'20px',textAlign:'center',opacity:0.6}}>
                  No inventory items. Add items below.
                </div>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className={styles.miniMetric} style={{textAlign:'left',backgroundColor:'rgba(16,185,129,0.1)',padding:'12px',borderRadius:'8px'}}>
                    <div className={styles.miniMetricLabel}>{item.resource_name}</div>
                    <div className={styles.miniMetricValue}>{item.quantity.toLocaleString()}</div>
                    <div style={{fontSize:'11px',opacity:0.7,marginTop:'4px'}}>{item.unit || 'units'}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px',marginTop:'12px'}}>
              <div className={styles.formGroup}>
                <label>Add Resource (name)</label>
                <input id="newResourceName" placeholder="e.g., Food Packets" />
              </div>
              <div className={styles.formGroup}>
                <label>Quantity</label>
                <input id="newResourceQty" type="number" placeholder="e.g., 1000" />
              </div>
              <div className={styles.formGroup}>
                <label>Unit</label>
                <input id="newResourceUnit" placeholder="e.g., packets" />
              </div>
              <button 
                className={styles.refreshBtn} 
                onClick={async () => {
                  const name = document.getElementById('newResourceName').value;
                  const qty = document.getElementById('newResourceQty').value;
                  const unit = document.getElementById('newResourceUnit').value;
                  if (!name || !qty) {
                    showNotification('Please enter resource name and quantity', 'warning');
                    return;
                  }
                  try {
                    const resp = await fetch('http://localhost:8000/api/inventory', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        resource_name: name,
                        quantity: parseInt(qty),
                        unit: unit || 'units'
                      })
                    });
                    if (resp.ok) {
                      showNotification('Inventory updated', 'success');
                      fetchInventory();
                      document.getElementById('newResourceName').value = '';
                      document.getElementById('newResourceQty').value = '';
                      document.getElementById('newResourceUnit').value = '';
                    } else {
                      showNotification('Failed to update inventory', 'error');
                    }
                  } catch (e) {
                    showNotification('Failed to update inventory', 'error');
                  }
                }}
              >
                Add to Inventory
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Distribution & Assignment</h3>
              <span className={styles.cardIcon}>🎯</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>District/Region</label><input placeholder="e.g., North District" /></div>
              <div className={styles.formGroup}><label>Resource</label><input placeholder="e.g., Boats" /></div>
              <div className={styles.formGroup}><label>Quantity</label><input type="number" placeholder="e.g., 5" /></div>
              <div className={styles.formGroup}><label>Priority</label><input placeholder="High/Moderate/Low" /></div>
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Resources assigned to district', 'success')}>Assign</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Assignment updated', 'info')}>Update</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Assignment removed', 'warning')}>Remove</button>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Current Deployments</h4>
              {[
                {where:'Assam, India', what:'Boats', qty:8, status:'enroute'},
                {where:'Jakarta, Indonesia', what:'Food Packets', qty:5000, status:'delivered'},
                {where:'Louisiana, USA', what:'Water (L)', qty:15000, status:'loading'}
              ].map((d,i)=> (
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr',gap:'8px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>{d.where}</div>
                  <div>{d.what}</div>
                  <div>Qty: {d.qty.toLocaleString()}</div>
                  <div>Status: {d.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Logistics & Tracking</h3>
              <span className={styles.cardIcon}>🚚</span>
            </div>
            <div className={styles.metric}><span className={styles.metricLabel}>Boats Available</span><span className={styles.metricValue}>20</span></div>
            <div className={styles.metric}><span className={styles.metricLabel}>Boats Deployed</span><span className={styles.metricValue}>8</span></div>
            <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Routes optimized for delivery', 'success')}>Optimize Routes</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Live positions refreshed', 'info')}>Refresh Locations</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Duplicate delivery avoided', 'warning')}>Check Duplication</button>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Recent Movements</h4>
              <div style={{fontSize:'12px',opacity:0.8}}>Boat-7 → Riverbank Sector, Truck-12 → Warehouse B → East District</div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Resource Requests from Users</h3>
              <span className={styles.cardIcon}>📨</span>
            </div>
            {resourceRequests.length === 0 ? (
              <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No pending requests</div>
            ) : (
              resourceRequests.map(req => (
                <div key={req.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 2fr',gap:'8px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor:'rgba(16,185,129,0.05)'}}>
                  <div>
                    <div style={{fontWeight:'600'}}>{req.user_name}</div>
                    <div style={{fontSize:'11px',opacity:0.7}}>{new Date(req.requested_at).toLocaleString()}</div>
                  </div>
                  <div>{req.resource_name}</div>
                  <div>Qty: {req.quantity}</div>
                  <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                    <button 
                      className={styles.refreshBtn} 
                      onClick={() => approveRequest(req.id)}
                      style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'13px'}}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      className={styles.refreshBtn} 
                      onClick={() => rejectRequest(req.id)}
                      style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'13px'}}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div id="evacuation" className={`${styles.contentSection} ${currentSection === 'evacuation' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Evacuation Planning</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Routes</h3>
              <span className={styles.cardIcon}>🗺️</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>From</label><input placeholder="Village X" /></div>
              <div className={styles.formGroup}><label>To (Safe Zone)</label><input placeholder="Shelter Y" /></div>
              <div className={styles.formGroup}><label>Status</label><input placeholder="safe/unsafe/monitor" /></div>
              <button className={styles.refreshBtn} onClick={() => showNotification('Route saved', 'success')}>Save Route</button>
            </div>
            <div style={{marginTop:'10px'}}>
              <div style={{background:'rgba(255,255,255,0.05)',height:'160px',display:'flex',alignItems:'center',justifyContent:'center'}}>Map placeholder (GIS integration)</div>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Existing Routes</h4>
              {[{from:'Sector 12', to:'School A', status:'safe'},{from:'Riverbank', to:'Hall B', status:'unsafe'}].map((r,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr',gap:'8px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>From: {r.from}</div>
                  <div>To: {r.to}</div>
                  <div>Status: {r.status}</div>
                  <button className={styles.refreshBtn} onClick={() => showNotification('Route updated', 'info')}>Update</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Shelters & Safe Zones</h3>
              <span className={styles.cardIcon}>🏥</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Shelter Name</label><input id="shelterName" placeholder="School A" /></div>
              <div className={styles.formGroup}><label>Capacity</label><input id="shelterCapacity" type="number" placeholder="500" /></div>
              <div className={styles.formGroup}><label>Assigned Region</label><input id="shelterRegion" placeholder="Sector 12" /></div>
              <button 
                className={styles.refreshBtn} 
                onClick={async () => {
                  const name = document.getElementById('shelterName').value;
                  const capacity = document.getElementById('shelterCapacity').value;
                  const region = document.getElementById('shelterRegion').value;
                  const success = await createShelter(name, capacity, region);
                  if (success) {
                    document.getElementById('shelterName').value = '';
                    document.getElementById('shelterCapacity').value = '';
                    document.getElementById('shelterRegion').value = '';
                  }
                }}
              >
                Save Shelter
              </button>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Current Shelters ({shelters.length})</h4>
              {shelters.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No shelters added yet</div>
              ) : (
                shelters.map((s)=>(
                  <div key={s.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'8px',padding:'10px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor:'rgba(16,185,129,0.05)'}}>
                    <div style={{fontWeight:600}}>{s.name}</div>
                    <div>Cap: {s.capacity}</div>
                    <div>Region: {s.assigned_region}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Evacuation alerts pushed', 'success')}>Push Alerts</button>
              <button className={styles.refreshBtn} onClick={() => showNotification('Evacuation protocols shared with authorities', 'info')}>Share Protocols</button>
            </div>
          </div>
        </div>

        <div id="users" className={`${styles.contentSection} ${currentSection === 'users' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>User Management</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>User Accounts</h3>
              <span className={styles.cardIcon}>👥</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Name</label><input placeholder="Officer Name" /></div>
              <div className={styles.formGroup}><label>Email</label><input placeholder="officer@agency.gov" /></div>
              <div className={styles.formGroup}><label>Role</label><input placeholder="Admin/District Officer/Rescue" /></div>
              <button className={styles.refreshBtn} onClick={() => showNotification('User added', 'success')}>Add User</button>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Users</span>
              <span className={styles.metricValue}>{usersCount}</span>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Existing Users</h4>
              {(Array.isArray(users) ? users : []).map((u,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 2fr 1.5fr',gap:'8px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>{u.name}</div>
                  <div>{u.role}</div>
                  <div>{u.email}</div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button className={styles.refreshBtn} onClick={() => showNotification('User updated', 'info')}>Update</button>
                    <button className={styles.refreshBtn} onClick={() => showNotification('User removed', 'warning')}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Roles & Permissions</h3>
              <span className={styles.cardIcon}>🔐</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Define Role</label><input placeholder="AI Agent Operator" /></div>
              <div className={styles.formGroup}><label>Access Modules</label><input placeholder="Resources, Monitoring" /></div>
              <button className={styles.refreshBtn} onClick={() => showNotification('Role saved', 'success')}>Save Role</button>
            </div>
            <div style={{marginTop:'10px'}}>
              <h4>Security Settings</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
                <div className={styles.formGroup}><label>MFA for Critical Roles</label><input type="checkbox" defaultChecked /></div>
                <div className={styles.formGroup}><label>Session Timeout (min)</label><input type="number" defaultValue={30} /></div>
                <div className={styles.formGroup}><label>Password Policy</label><input placeholder="Min 8 chars, symbol required" /></div>
              </div>
            </div>

            <div style={{marginTop:'10px'}}>
              <h4>Activity Logs</h4>
              <div style={{fontSize:'12px',opacity:0.8}}>Admin approved 2 resource requests • District Officer updated route to School A • Rescue Team marked shelter full</div>
            </div>
          </div>
        </div>

        <div id="issues" className={`${styles.contentSection} ${currentSection === 'issues' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Issues & Support</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Community Reports ({communityReports.length})</h3>
              <span className={styles.cardIcon}>📋</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'10px',marginBottom:'10px'}}>
              <input placeholder="Search reports..." value={issueSearch} onChange={(e)=>setIssueSearch(e.target.value)} style={{padding:'8px',border:'1px solid rgba(0,255,136,0.3)',background:'rgba(255,255,255,0.05)',color:'#fff',borderRadius:'6px'}} />
              <select value={issueFilter} onChange={(e)=>setIssueFilter(e.target.value)} style={{padding:'8px',border:'1px solid rgba(0,255,136,0.3)',background:'rgba(255,255,255,0.05)',color:'#fff',borderRadius:'6px'}}>
                <option value="all" style={{color:'#000'}}>All</option>
                <option value="open" style={{color:'#000'}}>Open</option>
                <option value="investigating" style={{color:'#000'}}>Investigating</option>
                <option value="resolved" style={{color:'#000'}}>Resolved</option>
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 2fr 1.5fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>Type</div>
              <div>Status</div>
              <div>Details</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'420px',overflowY:'auto'}}>
              {communityReports.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No community reports yet</div>
              ) : (
                communityReports
                  .filter(report => issueFilter==='all' ? true : report.status===issueFilter)
                  .filter(report => (issueSearch||'').trim()==='' ? true : (report.report_type?.toLowerCase().includes(issueSearch.toLowerCase()) || report.description?.toLowerCase().includes(issueSearch.toLowerCase())))
                  .map(report => (
                    <div key={report.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 2fr 1.5fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: report.status === 'open' ? 'rgba(255,107,107,0.05)' : 'transparent'}}>
                      <div>
                        <div style={{fontWeight:600}}>{report.report_type}</div>
                        <div style={{fontSize:'11px',opacity:0.7,marginTop:'4px'}}>By: {report.user_name}</div>
                      </div>
                      <div>
                        <span 
                          className={styles.miniMetric} 
                          style={{
                            padding:'4px 8px',
                            display:'inline-block',
                            background: report.status === 'open' ? 'rgba(255,107,107,0.2)' : (report.status === 'investigating' ? 'rgba(255,167,38,0.2)' : 'rgba(16,185,129,0.2)'),
                            color: report.status === 'open' ? '#ff6b6b' : (report.status === 'investigating' ? '#ffa726' : '#10b981')
                          }}
                        >
                          {report.status.toUpperCase()}
                        </span>
                        <div style={{fontSize:'11px',opacity:0.7,marginTop:'4px'}}>{new Date(report.reported_at).toLocaleString()}</div>
                      </div>
                      <div style={{opacity:0.9,fontSize:'13px'}}>{report.description}</div>
                      <div style={{display:'flex',gap:'6px',justifyContent:'flex-end',flexWrap:'wrap'}}>
                        {report.status === 'open' && (
                          <button 
                            className={styles.refreshBtn} 
                            onClick={() => investigateReport(report.id)}
                            style={{backgroundColor:'#ffa726',padding:'6px 10px',fontSize:'12px'}}
                          >
                            Investigate
                          </button>
                        )}
                        {report.status !== 'resolved' && (
                          <button 
                            className={styles.refreshBtn} 
                            onClick={() => resolveReport(report.id)}
                            style={{backgroundColor:'#10b981',padding:'6px 10px',fontSize:'12px'}}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div id="funding" className={`${styles.contentSection} ${currentSection === 'funding' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Funding & Volunteers</h2>
          
          {/* Donations Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Monetary Donations ({donations.filter(d => d.status === 'pending').length})</h3>
              <span className={styles.cardIcon}>💰</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1.5fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>Donor</div>
              <div>Amount</div>
              <div>Status</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'400px',overflowY:'auto'}}>
              {donations.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No donations yet</div>
              ) : (
                donations.map(donation => (
                  <div key={donation.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1.5fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: donation.status === 'pending' ? 'rgba(16,185,129,0.05)' : 'transparent'}}>
                    <div>
                      <div style={{fontWeight:600}}>{donation.donor_name || 'Anonymous'}</div>
                      <div style={{fontSize:'11px',opacity:0.7}}>{donation.donor_email}</div>
                    </div>
                    <div style={{fontSize:'18px',fontWeight:'bold',color:'#10b981'}}>₹{donation.amount.toLocaleString()}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        backgroundColor: donation.status === 'accepted' ? '#10b98144' : (donation.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                        color: donation.status === 'accepted' ? '#10b981' : (donation.status === 'rejected' ? '#ef4444' : '#f59e0b')
                      }}>
                        {donation.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:'6px',justifyContent:'flex-end'}}>
                      {donation.status === 'pending' && (
                        <>
                          <button className={styles.refreshBtn} onClick={() => acceptDonation(donation.id)} style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'12px'}}>✓ Accept</button>
                          <button className={styles.refreshBtn} onClick={() => rejectDonation(donation.id)} style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'12px'}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Item Pickups Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Item Donation Pickups ({itemPickups.filter(p => p.status === 'pending').length})</h3>
              <span className={styles.cardIcon}>📦</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>Items</div>
              <div>Address</div>
              <div>Status</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'400px',overflowY:'auto'}}>
              {itemPickups.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No pickup requests yet</div>
              ) : (
                itemPickups.map(pickup => (
                  <div key={pickup.id} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: pickup.status === 'pending' ? 'rgba(16,185,129,0.05)' : 'transparent'}}>
                    <div style={{fontSize:'13px'}}>{pickup.items}</div>
                    <div style={{fontSize:'12px',opacity:0.8}}>{pickup.pickup_address}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        backgroundColor: pickup.status === 'scheduled' ? '#10b98144' : (pickup.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                        color: pickup.status === 'scheduled' ? '#10b981' : (pickup.status === 'rejected' ? '#ef4444' : '#f59e0b')
                      }}>
                        {pickup.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:'6px',justifyContent:'flex-end'}}>
                      {pickup.status === 'pending' && (
                        <>
                          <button className={styles.refreshBtn} onClick={() => schedulePickup(pickup.id)} style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'12px'}}>✓ Schedule</button>
                          <button className={styles.refreshBtn} onClick={() => rejectPickup(pickup.id)} style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'12px'}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Volunteer Requests Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Volunteer Requests ({volunteerRequests.filter(v => v.status === 'pending').length})</h3>
              <span className={styles.cardIcon}>🙋‍♂️</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 2fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>Name</div>
              <div>Contact</div>
              <div>Duration</div>
              <div>Status</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'400px',overflowY:'auto'}}>
              {volunteerRequests.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No volunteer requests yet</div>
              ) : (
                volunteerRequests.map(volunteer => (
                  <div key={volunteer.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 2fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: volunteer.status === 'pending' ? 'rgba(16,185,129,0.05)' : 'transparent'}}>
                    <div>
                      <div style={{fontWeight:600}}>{volunteer.volunteer_name}</div>
                      <div style={{fontSize:'11px',opacity:0.7}}>{volunteer.areas_of_interest}</div>
                    </div>
                    <div style={{fontSize:'12px'}}>
                      <div>{volunteer.volunteer_email}</div>
                      <div>{volunteer.volunteer_phone}</div>
                    </div>
                    <div>{volunteer.duration_months} month{volunteer.duration_months > 1 ? 's' : ''}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        backgroundColor: volunteer.status === 'accepted' ? '#10b98144' : (volunteer.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                        color: volunteer.status === 'accepted' ? '#10b981' : (volunteer.status === 'rejected' ? '#ef4444' : '#f59e0b')
                      }}>
                        {volunteer.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:'6px',justifyContent:'flex-end',alignItems:'center'}}>
                      {volunteer.status === 'pending' && (
                        <>
                          <select id={`duration-${volunteer.id}`} defaultValue={volunteer.duration_months} style={{padding:'4px 8px',backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'4px',color:'white',fontSize:'12px'}}>
                            <option value="1">1 Month</option>
                            <option value="2">2 Months</option>
                            <option value="6">6 Months</option>
                          </select>
                          <button className={styles.refreshBtn} onClick={() => {
                            const duration = document.getElementById(`duration-${volunteer.id}`).value;
                            acceptVolunteer(volunteer.id, parseInt(duration));
                          }} style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'12px'}}>✓ Accept</button>
                          <button className={styles.refreshBtn} onClick={() => rejectVolunteer(volunteer.id)} style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'12px'}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div id="analytics" className={`${styles.contentSection} ${currentSection === 'analytics' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>System Analytics</h2>
          
          {/* Overview Metrics */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'15px',marginBottom:'20px'}}>
            <div className={styles.card} style={{padding:'20px',textAlign:'center'}}>
              <h4 style={{margin:'0 0 10px 0',opacity:0.8}}>Total Floods Predicted</h4>
              <div style={{fontSize:'2.5rem',fontWeight:'bold',color:'#00ff88'}}>{floods.length}</div>
            </div>
            <div className={styles.card} style={{padding:'20px',textAlign:'center'}}>
              <h4 style={{margin:'0 0 10px 0',opacity:0.8}}>Total Users</h4>
              <div style={{fontSize:'2.5rem',fontWeight:'bold',color:'#00d4ff'}}>{usersCount}</div>
            </div>
            <div className={styles.card} style={{padding:'20px',textAlign:'center'}}>
              <h4 style={{margin:'0 0 10px 0',opacity:0.8}}>Resource Requests</h4>
              <div style={{fontSize:'2.5rem',fontWeight:'bold',color:'#ffa726'}}>{resourceRequests.length}</div>
            </div>
            <div className={styles.card} style={{padding:'20px',textAlign:'center'}}>
              <h4 style={{margin:'0 0 10px 0',opacity:0.8}}>Community Reports</h4>
              <div style={{fontSize:'2.5rem',fontWeight:'bold',color:'#a78bfa'}}>{communityReports.length}</div>
            </div>
          </div>

          {/* Regional Severity Analysis */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Regional Severity Analysis</h3>
              <span className={styles.cardIcon}>📊</span>
            </div>
            <div style={{height:'300px'}}>
              <Bar data={{
                labels: ['Assam', 'Kerala', 'Uttar Pradesh', 'West Bengal', 'Odisha'],
                datasets: [{
                  label: 'High Severity',
                  data: [12, 8, 5, 10, 7],
                  backgroundColor: '#ef4444'
                }, {
                  label: 'Medium Severity',
                  data: [8, 15, 12, 8, 10],
                  backgroundColor: '#ffa726'
                }, {
                  label: 'Low Severity',
                  data: [5, 7, 8, 6, 8],
                  backgroundColor: '#10b981'
                }]
              }} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                  y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
                },
                plugins: {
                  legend: { labels: { color: '#fff' } }
                }
              }} />
            </div>
          </div>

          {/* Resources Requested & Allocated */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))',gap:'20px'}}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Resources Requested</h3>
                <span className={styles.cardIcon}>📦</span>
              </div>
              <div style={{height:'300px'}}>
                <Bar data={{
                  labels: ['Food', 'Water', 'Shelter', 'Medicine', 'Clothing'],
                  datasets: [{
                    label: 'Quantity Requested',
                    data: [
                      resourceRequests.filter(r => r.resource_name.toLowerCase().includes('food')).reduce((sum, r) => sum + r.quantity, 0),
                      resourceRequests.filter(r => r.resource_name.toLowerCase().includes('water')).reduce((sum, r) => sum + r.quantity, 0),
                      resourceRequests.filter(r => r.resource_name.toLowerCase().includes('shelter')).reduce((sum, r) => sum + r.quantity, 0),
                      resourceRequests.filter(r => r.resource_name.toLowerCase().includes('medicine')).reduce((sum, r) => sum + r.quantity, 0),
                      resourceRequests.filter(r => r.resource_name.toLowerCase().includes('cloth')).reduce((sum, r) => sum + r.quantity, 0)
                    ],
                    backgroundColor: '#00d4ff'
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }} />
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Resources Allocated (Pie)</h3>
                <span className={styles.cardIcon}>🎯</span>
              </div>
              <div style={{height:'300px'}}>
                <Pie data={{
                  labels: inventory.map(item => item.resource_name),
                  datasets: [{
                    data: inventory.map(item => item.quantity),
                    backgroundColor: ['#10b981', '#00d4ff', '#ffa726', '#a78bfa', '#f472b6', '#34d399']
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Issues Status */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Community Reports Status</h3>
              <span className={styles.cardIcon}>🔧</span>
            </div>
            <div style={{height:'300px'}}>
              <Bar data={{
                labels: ['Open', 'Investigating', 'Resolved'],
                datasets: [{
                  label: 'Number of Reports',
                  data: [
                    communityReports.filter(r => r.status === 'open').length,
                    communityReports.filter(r => r.status === 'investigating').length,
                    communityReports.filter(r => r.status === 'resolved').length
                  ],
                  backgroundColor: ['#ef4444', '#ffa726', '#10b981']
                }]
              }} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                  x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
                },
                plugins: {
                  legend: { labels: { color: '#fff' } }
                }
              }} />
            </div>
          </div>

          {/* Funding & Volunteers Status */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))',gap:'20px'}}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Donation Status</h3>
                <span className={styles.cardIcon}>💰</span>
              </div>
              <div style={{height:'300px'}}>
                <Bar data={{
                  labels: ['Pending', 'Accepted', 'Rejected'],
                  datasets: [{
                    label: 'Donations',
                    data: [
                      donations.filter(d => d.status === 'pending').length,
                      donations.filter(d => d.status === 'accepted').length,
                      donations.filter(d => d.status === 'rejected').length
                    ],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }} />
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Volunteer Requests Status</h3>
                <span className={styles.cardIcon}>🙋‍♂️</span>
              </div>
              <div style={{height:'300px'}}>
                <Doughnut data={{
                  labels: ['Pending', 'Accepted', 'Rejected'],
                  datasets: [{
                    data: [
                      volunteerRequests.filter(v => v.status === 'pending').length,
                      volunteerRequests.filter(v => v.status === 'accepted').length,
                      volunteerRequests.filter(v => v.status === 'rejected').length
                    ],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Total Donation Amount */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Total Donations Received</h3>
              <span className={styles.cardIcon}>💵</span>
            </div>
            <div style={{padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:'3rem',fontWeight:'bold',color:'#10b981'}}>
                ₹{donations.filter(d => d.status === 'accepted').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </div>
              <div style={{fontSize:'14px',opacity:0.7,marginTop:'10px'}}>
                From {donations.filter(d => d.status === 'accepted').length} accepted donations
              </div>
            </div>
          </div>
        </div>

        <div id="recovery" className={`${styles.contentSection} ${currentSection === 'recovery' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Recovery Reports</h2>
          
          {/* Damage Reports Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Damage Assessment Reports ({damageReports.filter(r => r.status === 'pending').length})</h3>
              <span className={styles.cardIcon}>📋</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1.5fr 1fr 2fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>User</div>
              <div>Property Type</div>
              <div>Damage Level</div>
              <div>Estimated Loss</div>
              <div>Status</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'400px',overflowY:'auto'}}>
              {damageReports.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No damage reports yet</div>
              ) : (
                damageReports.map(report => (
                  <div key={report.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1.5fr 1fr 2fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: report.status === 'pending' ? 'rgba(16,185,129,0.05)' : 'transparent'}}>
                    <div>
                      <div style={{fontWeight:600}}>{report.user_name}</div>
                      <div style={{fontSize:'11px',opacity:0.7}}>{new Date(report.submitted_at).toLocaleString()}</div>
                    </div>
                    <div>{report.property_type}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'11px',
                        backgroundColor: report.damage_level.includes('Severe') || report.damage_level.includes('Major') ? '#ef444444' : '#ffa72644',
                        color: report.damage_level.includes('Severe') || report.damage_level.includes('Major') ? '#ef4444' : '#ffa726'
                      }}>
                        {report.damage_level}
                      </span>
                    </div>
                    <div style={{fontWeight:'bold',color:'#ef4444',fontSize:'14px'}}>₹{report.estimated_loss.toLocaleString()}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        backgroundColor: report.status === 'approved' ? '#10b98144' : (report.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                        color: report.status === 'approved' ? '#10b981' : (report.status === 'rejected' ? '#ef4444' : '#f59e0b')
                      }}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:'6px',justifyContent:'flex-end'}}>
                      {report.status === 'pending' && (
                        <>
                          <button className={styles.refreshBtn} onClick={() => approveDamageReport(report.id)} style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'12px'}}>✓ Approve</button>
                          <button className={styles.refreshBtn} onClick={() => rejectDamageReport(report.id)} style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'12px'}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Financial Aid Requests Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Financial Aid Requests ({financialAidRequests.filter(a => a.status === 'pending').length})</h3>
              <span className={styles.cardIcon}>💰</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1.5fr 1.5fr 1fr 2fr',gap:'12px',padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'8px',marginBottom:'8px',fontSize:'12px',opacity:0.8}}>
              <div>User</div>
              <div>Aid Type</div>
              <div>Amount Requested</div>
              <div>Status</div>
              <div style={{textAlign:'right'}}>Actions</div>
            </div>
            <div style={{maxHeight:'400px',overflowY:'auto'}}>
              {financialAidRequests.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',opacity:0.6}}>No financial aid requests yet</div>
              ) : (
                financialAidRequests.map(aid => (
                  <div key={aid.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1.5fr 1.5fr 1fr 2fr',gap:'12px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.08)',backgroundColor: aid.status === 'pending' ? 'rgba(16,185,129,0.05)' : 'transparent'}}>
                    <div>
                      <div style={{fontWeight:600}}>{aid.user_name}</div>
                      <div style={{fontSize:'11px',opacity:0.7}}>{new Date(aid.requested_at).toLocaleString()}</div>
                    </div>
                    <div>{aid.aid_type}</div>
                    <div style={{fontWeight:'bold',color:'#10b981',fontSize:'14px'}}>₹{aid.amount_requested.toLocaleString()}</div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        backgroundColor: aid.status === 'approved' ? '#10b98144' : (aid.status === 'rejected' ? '#ef444444' : '#f59e0b44'),
                        color: aid.status === 'approved' ? '#10b981' : (aid.status === 'rejected' ? '#ef4444' : '#f59e0b')
                      }}>
                        {aid.status.toUpperCase()}
                      </span>
                      {aid.approved_amount && (
                        <div style={{fontSize:'11px',marginTop:'4px',color:'#10b981'}}>Approved: ₹{aid.approved_amount.toLocaleString()}</div>
                      )}
                    </div>
                    <div style={{display:'flex',gap:'6px',justifyContent:'flex-end',alignItems:'center'}}>
                      {aid.status === 'pending' && (
                        <>
                          <input id={`aid-amount-${aid.id}`} type="number" defaultValue={aid.amount_requested} placeholder="Approved amount" style={{width:'120px',padding:'6px 8px',backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'4px',color:'white',fontSize:'12px'}} />
                          <button className={styles.refreshBtn} onClick={() => {
                            const amount = document.getElementById(`aid-amount-${aid.id}`).value;
                            approveFinancialAid(aid.id, parseFloat(amount));
                          }} style={{backgroundColor:'#10b981',padding:'6px 12px',fontSize:'12px'}}>✓ Approve</button>
                          <button className={styles.refreshBtn} onClick={() => rejectFinancialAid(aid.id)} style={{backgroundColor:'#ef4444',padding:'6px 12px',fontSize:'12px'}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div id="settings" className={`${styles.contentSection} ${currentSection === 'settings' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>System Settings</h2>
          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>1) Prediction & Alert Settings</h3><span className={styles.cardIcon}>⚠️</span></div>
            <h4>Threshold Configuration</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Rainfall (mm/hr)</label><input type="number" defaultValue={50} /></div>
              <div className={styles.formGroup}><label>River Level (m)</label><input type="number" defaultValue={5} /></div>
              <div className={styles.formGroup}><label>Soil Saturation (%)</label><input type="number" defaultValue={85} /></div>
              <div className={styles.formGroup}><label>Dam Storage (%)</label><input type="number" defaultValue={90} /></div>
            </div>
            <h4 style={{marginTop:'10px'}}>Alert Levels & Escalation</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Severity Levels</label><input placeholder="Low, Moderate, High, Extreme" defaultValue="Low, Moderate, High, Extreme"/></div>
              <div className={styles.formGroup}><label>Notify</label><input placeholder="Citizens, Officials, Central" defaultValue="Citizens, Officials, Central"/></div>
            </div>
            <h4 style={{marginTop:'10px'}}>Notification Preferences</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Channels</label><input placeholder="SMS, Email, Push, Siren, WhatsApp, Boards" defaultValue="SMS, Email, Push, Siren, WhatsApp, Boards"/></div>
              <div className={styles.formGroup}><label>Language</label><input placeholder="English + Local" defaultValue="English + Local"/></div>
            </div>
            <button className={styles.refreshBtn} onClick={() => showNotification('Prediction & alerts saved', 'success')} style={{marginTop:'10px'}}>Save Section</button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>2) Data Sources & Integrations</h3><span className={styles.cardIcon}>🔗</span></div>
            <h4>Satellite Integration</h4>
            <div className={styles.formGroup}><label>Connected Feeds</label><input placeholder="ISRO, NASA, IMD" defaultValue="ISRO, NASA, IMD"/></div>
            <div style={{display:'flex',gap:'10px'}}>
              <button className={styles.refreshBtn} onClick={()=>showNotification('Feeds connected', 'success')}>Connect</button>
              <button className={styles.refreshBtn} onClick={()=>showNotification('Feeds disconnected', 'warning')}>Disconnect</button>
            </div>
            <h4 style={{marginTop:'10px'}}>Weather Stations & IoT</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Add Station/Device</label><input placeholder="WX-102 / Gauge-7"/></div>
              <div className={styles.formGroup}><label>Calibration Interval (days)</label><input type="number" defaultValue={15}/></div>
              <div className={styles.formGroup}><label>API Keys</label><input placeholder="Weather, GIS, Gov DB"/></div>
              <div className={styles.formGroup}><label>Refresh Frequency (min)</label><input type="number" defaultValue={5}/></div>
            </div>
            <button className={styles.refreshBtn} onClick={() => showNotification('Integrations saved', 'success')} style={{marginTop:'10px'}}>Save Section</button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>3) AI & Model Settings</h3><span className={styles.cardIcon}>🧠</span></div>
            <h4>Model Selection</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Enabled Models</label><input placeholder="Rainfall-based, River-overflow, Combined" defaultValue="Combined"/></div>
              <div className={styles.formGroup}><label>Re-train with Latest Data</label><button className={styles.refreshBtn} onClick={()=>showNotification('Model retraining queued', 'info')}>Re-train</button></div>
            </div>
            <h4 style={{marginTop:'10px'}}>Parameter Weights</h4>
            <div className={styles.formGroup}><label>Rainfall Weight</label><input type="range" min="0" max="1" step="0.05" defaultValue={0.4}/></div>
            <div className={styles.formGroup}><label>River Level Weight</label><input type="range" min="0" max="1" step="0.05" defaultValue={0.6}/></div>
            <div className={styles.formGroup}><label>Simulation Mode</label><button className={styles.refreshBtn} onClick={()=>showNotification('Simulation started', 'success')}>Run Simulation</button></div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>4) Resource & Evacuation</h3><span className={styles.cardIcon}>🚁</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Resource Templates</label><input placeholder="Boats, Food, Med Kits, Shelters" defaultValue="Boats, Food, Med Kits, Shelters"/></div>
              <div className={styles.formGroup}><label>Upload GIS Maps</label><input type="file"/></div>
              <div className={styles.formGroup}><label>Shelter Max Capacity</label><input type="number" defaultValue={500}/></div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>5) User & Access Control</h3><span className={styles.cardIcon}>🔐</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Create Role</label><input placeholder="Rescue Coordinator"/></div>
              <div className={styles.formGroup}><label>Permissions</label><input placeholder="Resources, Evacuation, Alerts"/></div>
              <div className={styles.formGroup}><label>Enable 2FA</label><input type="checkbox" defaultChecked/></div>
              <div className={styles.formGroup}><label>Password Policy</label><input placeholder="Expiry 90d, complexity high"/></div>
              <div className={styles.formGroup}><label>Failed Login Limit</label><input type="number" defaultValue={5}/></div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>6) System Health & Performance</h3><span className={styles.cardIcon}>🖥️</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>CPU Threshold (%)</label><input type="number" defaultValue={85}/></div>
              <div className={styles.formGroup}><label>Memory Threshold (%)</label><input type="number" defaultValue={85}/></div>
              <div className={styles.formGroup}><label>Backup Schedule</label><input placeholder="Daily 02:00" defaultValue="Daily 02:00"/></div>
              <div className={styles.formGroup}><label>Recovery Protocol</label><input placeholder="Run DR-Plan v1"/></div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>7) Audit & Logging</h3><span className={styles.cardIcon}>🧾</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Activity Logs</label><input type="checkbox" defaultChecked/></div>
              <div className={styles.formGroup}><label>System Event Logs</label><input type="checkbox" defaultChecked/></div>
              <div className={styles.formGroup}><label>Compliance</label><input placeholder="Gov/Audit retention policy"/></div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>8) Localization & Customization</h3><span className={styles.cardIcon}>🌐</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Languages</label><input placeholder="English, Hindi, Assamese" defaultValue="English, Hindi"/></div>
              <div className={styles.formGroup}><label>Timezone/Region</label><input placeholder="IST / Assam" defaultValue="IST"/></div>
              <div className={styles.formGroup}><label>Branding</label><input placeholder="Upload logo / Govt branding"/></div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>9) Communication & Collaboration</h3><span className={styles.cardIcon}>📞</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px'}}>
              <div className={styles.formGroup}><label>Emergency Contacts</label><input placeholder="Police, Hospitals, NDRF, NGOs"/></div>
              <div className={styles.formGroup}><label>IVR Call Alerts</label><input placeholder="Provider/Access Token"/></div>
              <div className={styles.formGroup}><label>Collaboration Tools</label><input placeholder="Slack, Teams, WhatsApp"/></div>
            </div>
            <button className={styles.refreshBtn} onClick={() => showNotification('All settings saved', 'success')} style={{marginTop:'10px'}}>Save All</button>
          </div>
        </div>

        <div id="home" className={`${styles.contentSection} ${currentSection === 'home' ? styles.active : ''}`}>
          <div className={styles.card}>
            <h3>🏠 Return to Main Site</h3>
            <p>Navigate back to the main ACDMS interface.</p>
            <button className={styles.refreshBtn} onClick={() => window.location.href = '/'}>Go to Main Site</button>
          </div>
        </div>

        <div id="weather" className={`${styles.contentSection} ${currentSection === 'weather' ? styles.active : ''}`}>
          <h2 className={styles.sectionTitle}>Flood-Related Weather Dashboard</h2>
          <div className={styles.dashboardGrid}>
            {/* 1. Real-Time Weather Conditions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Real-Time Weather Conditions</h3>
                <span className={styles.cardIcon}>🌦️</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Rainfall Intensity (mm/hr)</span>
                <span className={styles.metricValue}>{Math.round(10 + Math.random() * 40)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Temperature (°C)</span>
                <span className={styles.metricValue}>{(25 + Math.random() * 5).toFixed(1)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Humidity (%)</span>
                <span className={styles.metricValue}>{Math.round(70 + Math.random() * 20)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Wind Speed (km/h)</span>
                <span className={styles.metricValue}>{Math.round(10 + Math.random() * 30)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Wind Direction</span>
                <span className={styles.metricValue}>{['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]}</span>
              </div>
            </div>

            {/* 2. Flood Risk Indicators */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Flood Risk Indicators</h3>
                <span className={styles.cardIcon}>⚠️</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>River Water Level (m)</span>
                <span className={styles.metricValue}>{(3 + Math.random() * 3).toFixed(2)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Soil Moisture (%)</span>
                <span className={styles.metricValue}>{Math.round(60 + Math.random() * 30)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Flood Warnings</span>
                <span className={styles.metricValue}>{['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]} Risk</span>
              </div>
              <div style={{marginTop: '10px'}}>
                <h4>District Alerts</h4>
                <ul>
                  <li>North District: High Risk</li>
                  <li>South District: Medium Risk</li>
                  <li>East District: Low Risk</li>
                </ul>
              </div>
            </div>

            {/* 3. Forecasting & Predictions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Forecasting & Predictions</h3>
                <span className={styles.cardIcon}>📈</span>
              </div>
              <div>
                <h4>Rainfall Forecast (mm - Next 24h)</h4>
                <Line data={{
                  labels: ['Now', '+3h', '+6h', '+12h', '+24h'],
                  datasets: [{ label: 'Rainfall', data: [20, 30, 25, 40, 15], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.2)' }]
                }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
              <div style={{marginTop: '10px'}}>
                <h4>Flood Prediction</h4>
                <p>Areas at risk: Riverbank, Central District (80% probability)</p>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Storm Alerts</span>
                <span className={styles.metricValue}>Active Cyclone Warning</span>
              </div>
            </div>

            {/* 4. Historical & Trend Data */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Historical & Trend Data</h3>
                <span className={styles.cardIcon}>📊</span>
              </div>
              <div>
                <h4>Rainfall Trends (Last 7 Days)</h4>
                <Bar data={{
                  labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
                  datasets: [{ label: 'Rainfall (mm)', data: [50, 60, 40, 70, 30, 80, 55], backgroundColor: '#00ff88' }]
                }} options={{ responsive: true }} />
              </div>
              <div style={{marginTop: '10px'}}>
                <h4>Flood Frequency (Y-o-Y)</h4>
                <Line data={{
                  labels: ['2020', '2021', '2022', '2023', '2024'],
                  datasets: [{ label: 'Flood Events', data: [5, 7, 4, 8, 6], borderColor: '#ffa726' }]
                }} options={{ responsive: true }} />
              </div>
            </div>

            {/* 5. Geospatial & Mapping Data */}
            <div className={styles.card} style={{gridColumn: 'span 2'}}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Geospatial & Mapping Data</h3>
                <span className={styles.cardIcon}>🗺️</span>
              </div>
              <div style={{position: 'relative', height: '300px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', overflow: 'hidden'}}>
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=68.1766,6.7479,97.4025,35.5087&layer=mapnik&marker=20.5937,78.9629"
                  style={{width: '100%', height: '100%', border: 'none'}}
                  title="India Flood-Prone Zones Map"
                />
                <div style={{position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px'}}>
                  🗺️ India - Flood-Prone Zones, Evacuation Routes, Shelters
                </div>
              </div>
              <div style={{marginTop: '10px'}}>
                <h4>Satellite Imagery</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <div style={{position: 'relative', height: '140px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', overflow: 'hidden'}}>
                    <iframe
                      src="https://www.openstreetmap.org/export/embed.html?bbox=76.2,9.0,77.0,10.0&layer=mapnik"
                      style={{width: '100%', height: '100%', border: 'none'}}
                      title="Current Flood Spread"
                    />
                    <div style={{position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px'}}>
                      Current Flood Spread
                    </div>
                  </div>
                  <div style={{position: 'relative', height: '140px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', overflow: 'hidden'}}>
                    <iframe
                      src="https://www.openstreetmap.org/export/embed.html?bbox=85.0,25.0,88.0,27.0&layer=mapnik"
                      style={{width: '100%', height: '100%', border: 'none'}}
                      title="Heat Map (Rainfall Intensity)"
                    />
                    <div style={{position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px'}}>
                      Heat Map (Rainfall Intensity)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="footprint" className={`${styles.contentSection} ${currentSection === 'footprint' ? styles.active : ''}`}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Carbon Footprint Calculator</h2>
            <div className={styles.footprintForm}>
              <div className={styles.formGroup}>
                <label>Electricity Usage (kWh/month):</label>
                <input
                  type="number"
                  name="electricityKWh"
                  value={footprintData.electricityKWh}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Car Miles Driven (miles/month):</label>
                <input
                  type="number"
                  name="carMiles"
                  value={footprintData.carMiles}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Flight Miles (miles/year):</label>
                <input
                  type="number"
                  name="flightsMiles"
                  value={footprintData.flightsMiles}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="recycling"
                    checked={footprintData.recycling}
                    onChange={handleInputChange}
                  /> Recycle Regularly
                </label>
              </div>
              <button className={styles.refreshBtn} onClick={calculateFootprint}>Calculate Footprint</button>
              <div className={styles.result}>
                <h3>Your Estimated Carbon Footprint: {carbonFootprint.toFixed(2)} kg CO2e</h3>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;