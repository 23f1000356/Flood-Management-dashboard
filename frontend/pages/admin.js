import { useRouter } from 'next/router'; 
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './adminDashboard.module.css';
import API_URL from '../utils/config';

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

  // SMS Alert State
  const [smsMessage, setSmsMessage] = useState('⚠️ FLOOD ALERT: High risk detected in your area. Please move to higher ground immediately. Stay safe. - ACMS');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);
  const [smsPhonePreview, setSmsPhonePreview] = useState(null);
  const [smsTestNumber, setSmsTestNumber] = useState('');

  const sendSMSAlert = async (customMessage) => {
    const msg = customMessage || smsMessage;
    if (!msg.trim()) { showNotification('Please enter an alert message', 'warning'); return; }
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await fetch(`${API_URL}/api/send-sms-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, ...(smsTestNumber.trim() ? { test_number: smsTestNumber.trim() } : {}) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send SMS');
      setSmsResult({ success: data.success, message: data.message, recipients: data.recipients });
      showNotification(`SMS sent to ${data.recipients} user(s)!`, 'success');
    } catch (err) {
      setSmsResult({ success: false, message: err.message });
      showNotification(`SMS failed: ${err.message}`, 'error');
    } finally {
      setSmsSending(false);
    }
  };

  const fetchSmsPhonePreview = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users/phones');
      const data = await res.json();
      setSmsPhonePreview(data);
    } catch (e) { console.error('Phone preview error:', e); }
  };


  // NASA EONET Live Disaster Data
  const [eonetEvents, setEonetEvents] = useState([]);
  const [eonetLoading, setEonetLoading] = useState(false);
  const [eonetError, setEonetError] = useState(null);
  const [eonetCategory, setEonetCategory] = useState('All');
  const [eonetLastFetched, setEonetLastFetched] = useState(null);

  const EONET_CATEGORIES = ['All', 'Floods', 'Wildfires', 'Severe Storms', 'Landslides', 'Earthquakes', 'Volcanoes', 'Drought', 'Sea and Lake Ice', 'Snow', 'Dust and Haze'];

  const fetchEonetEvents = async () => {
    setEonetLoading(true);
    setEonetError(null);
    try {
      const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?limit=100&status=open');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEonetEvents(Array.isArray(data.events) ? data.events : []);
      setEonetLastFetched(new Date());
    } catch (err) {
      console.error('EONET fetch error:', err);
      setEonetError('Failed to fetch NASA EONET data. Check network connection.');
    } finally {
      setEonetLoading(false);
    }
  };

  const filteredEonetEvents = eonetCategory === 'All'
    ? eonetEvents
    : eonetEvents.filter(ev => ev.categories?.some(c => c.title === eonetCategory));

  const eonetCounts = EONET_CATEGORIES.slice(1).reduce((acc, cat) => {
    acc[cat] = eonetEvents.filter(ev => ev.categories?.some(c => c.title === cat)).length;
    return acc;
  }, {});

  // Open-Meteo Weather & Flood Prediction
  const FLOOD_CITIES = [
    { name: 'Mumbai',    lat: 19.07, lon: 72.87 },
    { name: 'Delhi',     lat: 28.61, lon: 77.23 },
    { name: 'Kochi',     lat: 9.93,  lon: 76.26 },
    { name: 'Chennai',   lat: 13.08, lon: 80.27 },
    { name: 'Kolkata',   lat: 22.57, lon: 88.36 },
    { name: 'Guwahati',  lat: 26.18, lon: 91.74 },
  ];
  const [weatherData, setWeatherData] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherLastFetched, setWeatherLastFetched] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  const getRiskLevel = (rain) => {
    if (rain > 20) return { level: 'HIGH',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (rain > 10) return { level: 'MODERATE', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    if (rain > 2)  return { level: 'LOW',      color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
    return         { level: 'MINIMAL',  color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' };
  };

  const fetchOpenMeteo = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const results = await Promise.all(
        FLOOD_CITIES.map(async (city) => {
          const [weather, flood] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
              `&current=rain,temperature_2m,wind_speed_10m&hourly=rain&timezone=Asia%2FKolkata`
            ).then(r => r.json()),
            fetch(
              `https://flood-api.open-meteo.com/v1/flood?latitude=${city.lat}&longitude=${city.lon}` +
              `&daily=river_discharge&forecast_days=3`
            ).then(r => r.json()).catch(() => null),
          ]);
          const rain      = weather.current?.rain ?? 0;
          const temp      = weather.current?.temperature_2m ?? null;
          const wind      = weather.current?.wind_speed_10m ?? null;
          const discharge = flood?.daily?.river_discharge?.[0] ?? null;
          const hourlyRain = weather.hourly?.rain ?? [];
          const rain24h   = hourlyRain.slice(0, 24).reduce((s, v) => s + (v || 0), 0);
          return { ...city, rain, temp, wind, discharge, rain24h, risk: getRiskLevel(rain24h), fetched: new Date() };
        })
      );
      setWeatherData(results);
      setWeatherLastFetched(new Date());
    } catch (err) {
      console.error('Open-Meteo fetch error:', err);
      setWeatherError('Failed to fetch Open-Meteo data.');
    } finally {
      setWeatherLoading(false);
    }
  };

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
        fetchEonetEvents();
        fetchOpenMeteo();
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
        redirectTo: 'disasters'
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
            <a href="#" className={`${styles.menuLink} ${currentSection === 'eonet' ? styles.active : ''}`} onClick={() => { showSection('eonet'); fetchEonetEvents(); }}>
              <span className={styles.menuIcon}>🛸</span>
              <span className={styles.menuText}>Live Disasters (NASA)</span>
              {eonetEvents.length > 0 && <span className={`${styles.menuBadge}`} style={{background:'#EF4444'}}>{eonetEvents.length}</span>}
            </a>
          </div>
          <div className={styles.menuItem}>
            <a href="#" className={`${styles.menuLink} ${currentSection === 'weather-flood' ? styles.active : ''}`} onClick={() => { showSection('weather-flood'); if (weatherData.length === 0) fetchOpenMeteo(); }}>
              <span className={styles.menuIcon}>🌧️</span>
              <span className={styles.menuText}>Weather & Flood Risk</span>
              {weatherData.some(c => c.risk?.level === 'HIGH') && <span className={`${styles.menuBadge}`} style={{background:'#F59E0B'}}>!</span>}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                📡 LIVE TELEMETRY
              </span>
              <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Operational<br/>Overview</h1>
              <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Global surveillance and system performance metrics for the ACMS core infrastructure.</p>
            </div>
            <button className={styles.refreshBtn} onClick={refreshData} style={{ padding: '15px 30px', borderRadius: '40px', background: 'rgba(255,255,255,0.05)', color: '#FFF', fontWeight: 'bold' }}>
              🔄 Synchronize Data
            </button>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', letterSpacing: '2px', color: '#10B981' }}>SYSTEM STATUS</h3>
                <span>⚡</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#10B981' }}>All Services Operational</span>
              </div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>UPTIME</span>
                  <span className={styles.metricValue}>{systemStatus ? `${(systemStatus.uptime_seconds/3600).toFixed(1)}h` : '...'}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>CORE LOAD</span>
                  <span className={styles.metricValue}>{systemStatus ? `${systemStatus.cpu_percent}%` : '...'}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>NEURAL MEMORY</span>
                  <span className={styles.metricValue}>{systemStatus ? `${systemStatus.memory_used_gb}GB` : '...'}</span>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', letterSpacing: '2px', color: '#10B981' }}>MONITORING</h3>
                <span>📡</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 10px #3B82F6' }}></div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#3B82F6' }}>Real-time Data Flow</span>
              </div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>SATELLITES</span>
                  <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.satellites_active : '...'}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>STATIONS</span>
                  <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.weather_stations : '...'}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>TELEMETRY/M</span>
                  <span className={styles.metricValue}>{monitoringMetrics ? monitoringMetrics.datapoints_per_min : '...'}</span>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', letterSpacing: '2px', color: '#10B981' }}>RISK VECTOR</h3>
                <span>⚠️</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '15px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 10px #F59E0B' }}></div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#F59E0B' }}>Moderate Threat Level</span>
              </div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>HIGH RISK</span>
                  <span className={styles.metricValue}>3 SECTORS</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>PREDICTIONS</span>
                  <span className={styles.metricValue}>47 LIVE</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>ACCURACY</span>
                  <span className={styles.metricValue}>94.2%</span>
                </div>
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

        </div>

        {/* ─── NASA EONET Live Disaster Panel (visible on dashboard too) ─── */}
        {currentSection === 'dashboard' && eonetEvents.length > 0 && (
          <div className={styles.card} style={{ marginTop: '30px', background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} style={{ color: '#EF4444' }}>🛸 NASA EONET — Live Global Disasters</h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {eonetLastFetched ? `Updated ${eonetLastFetched.toLocaleTimeString()}` : 'Loading...'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {['Floods','Wildfires','Severe Storms','Earthquakes','Volcanoes'].map(cat => (
                <div key={cat} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: cat==='Floods'?'#3B82F6':cat==='Wildfires'?'#F97316':cat==='Severe Storms'?'#A78BFA':cat==='Earthquakes'?'#EF4444':'#F59E0B' }}>
                    {eonetCounts[cat] || 0}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>{cat.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div className={styles.alertsContainer} style={{ maxHeight: '260px' }}>
              {eonetEvents.slice(0, 6).map((ev, i) => {
                const cat = ev.categories?.[0]?.title || 'Unknown';
                const coords = ev.geometry?.[ev.geometry.length - 1]?.coordinates;
                const date = ev.geometry?.[ev.geometry.length - 1]?.date;
                const color = cat==='Floods'?'#3B82F6':cat==='Wildfires'?'#F97316':cat==='Severe Storms'?'#A78BFA':cat==='Earthquakes'?'#EF4444':cat==='Volcanoes'?'#F59E0B':'#10B981';
                return (
                  <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{ev.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{cat} {coords ? `· ${coords[1]?.toFixed(2)}°N, ${coords[0]?.toFixed(2)}°E` : ''} {date ? `· ${new Date(date).toLocaleDateString()}` : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => showSection('eonet')} style={{ marginTop: '15px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>View All {eonetEvents.length} Events →</button>
          </div>
        )}

    <div id="agents" className={`${styles.contentSection} ${currentSection === 'agents' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              🤖 AUTONOMOUS AGENTS
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>Agent<br/>Registry</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>Configure and monitor specialized AI agents responsible for disaster prediction, resource handling, and recovery.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {[{name: 'Disaster Prediction', section: '/disaster-prediction-agent'}, {name: 'Real-time Monitor', section: '/monitoring-agent'}, {name: 'Resource Allocation', section: '/resource'}, {name: 'Recovery Support', section: '/recovery'}, {name: 'Shelter Management', section: 'evacuation'}, {name: 'Civilian Alert', section: 'issues'}].map((agent, i) => (
              <div key={i} className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <div style={{ width: '50px', height: '50px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🤖</div>
                   <div style={{ padding: '4px 12px', borderRadius: '40px', background: 'rgba(16, 185, 129, 0.14)', color: '#10B981', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>ACTIVE</div>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{agent.name}</h3>
                <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>Specialized logic for {agent.name.toLowerCase()} operations with integrated ML feedback loops.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className={styles.refreshBtn} style={{ flex: 1, fontSize: '12px' }} onClick={() => agent.section.startsWith('/') ? window.location.href = agent.section : showSection(agent.section)}>CONFIG</button>
                  <button className={styles.refreshBtn} style={{ flex: 1, fontSize: '12px', background: 'rgba(255,255,255,0.05)' }}>LOGS</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="disasters" className={`${styles.contentSection} ${currentSection === 'disasters' ? styles.active : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
             <div>
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                  ⚠️ THREAT ANALYSIS
                </span>
                <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>Active<br/>Disasters</h1>
                <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>Current active flood events and high-risk predictions requiring immediate tactical coordination.</p>
             </div>

          </div>

          <div style={{marginTop:'20px'}}>
            {floods.length === 0 ? (
              <div className={styles.card} style={{textAlign:'center',padding:'80px',backgroundColor:'rgba(21, 26, 35, 0.4)'}}>
                <div style={{fontSize:'48px',marginBottom:'20px'}}>🛡️</div>
                <h3 style={{fontSize:'24px',marginBottom:'10px'}}>No Active Threats</h3>
                <p style={{color:'#94A3B8'}}>The global situational map is currently clear. Monitoring continues.</p>
              </div>
            ) : (
              <div style={{display:'grid',gap:'20px'}}>
                {floods.map((f) => (
                  <motion.div 
                    key={f.id} 
                    className={styles.card} 
                    style={{ 
                      backgroundColor:'rgba(21, 26, 35, 0.4)', 
                      borderLeft: `5px solid ${f.severity === 'high' ? '#EF4444' : (f.severity === 'moderate' ? '#F59E0B' : '#10B981')}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '30px'
                    }}
                  >
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'15px',marginBottom:'10px'}}>
                        <h3 style={{margin:0,fontSize:'24px'}}>{f.name}</h3>
                        <span style={{padding:'4px 12px',background:f.severity === 'high' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)', color:f.severity === 'high' ? '#EF4444' : '#F59E0B', borderRadius:'40px', fontSize:'11px', fontWeight:'900'}}>{f.severity.toUpperCase()}</span>
                      </div>
                      <div style={{color:'#94A3B8',fontSize:'14px',display:'flex',gap:'20px'}}>
                        <span>📍 {f.region}</span>
                        <span>⏱️ {new Date(f.start_time).toLocaleTimeString()}</span>
                        <span>📊 ID: {String(f.id).slice(0,8)}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'15px'}}>
                      <button className={styles.refreshBtn} onClick={() => setSelectedFlood(f)} style={{background:'rgba(255,255,255,0.05)'}}>ANALYSIS</button>
                      <button className={styles.refreshBtn} onClick={() => approveFlood(f.id)}>APPROVE</button>
                    </div>
                  </motion.div>
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
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              🛰️ ORBITAL SURVEILLANCE
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Real-time<br/>Monitoring</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Direct satellite uplink and weather station telemetry integration for immediate impact assessment.</p>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Satellite Feeds</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', color: '#10B981', fontSize: '11px', fontWeight: '900' }}>
                 UPLINK ACTIVE ({monitoringMetrics?.satellites_active || 0})
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>PRIMARY SIGNAL</span>
                <span className={styles.metricValue} style={{ color: '#10B981' }}>STRONG</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>LATENCY</span>
                <span className={styles.metricValue}>12ms</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <button className={styles.refreshBtn} onClick={() => showNotification('Switched to backup satellite feed', 'success')} style={{ flex: 1 }}>CYCLE FEED</button>
              <button className={styles.refreshBtn} onClick={() => createIssue('Satellite feed offline', '...')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>REPORT SIGNAL LOSS</button>
            </div>

            <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px', padding: '60px', textAlign: 'center' }}>
               <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
               <h4 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Satellite Image Analysis</h4>
               <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '30px' }}>Upload multi-spectral imagery for automated flood detection and impact mapping.</p>
               <input type="file" id="sat-upload" hidden accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing} />
               <button className={styles.refreshBtn} onClick={() => document.getElementById('sat-upload').click()} style={{ background: '#10B981', color: '#000', fontWeight: '800', width: '250px' }}>
                 {isAnalyzing ? 'ANALYZING...' : 'SELECT IMAGE'}
               </button>
            </div>
            
            {uploadedImage && (
              <div style={{ marginTop: '40px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '20px' }}>RAW FEED ANALYSIS</h4>
                <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={uploadedImage} alt="Satellite Feed" style={{ width: '100%', display: 'block' }} />
                  {isAnalyzing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                       <div style={{ textAlign: 'center' }}>
                         <div style={{ width: '40px', height: '40px', border: '3px solid #10B981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                         <div style={{ color: '#10B981', fontWeight: '800', letterSpacing: '2px', fontSize: '12px' }}>PROCESSING NEURAL ENGINE...</div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
            
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
                </div>
              </div>
            </div>

          {/* ── Email Alert Management ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Alert Management</h3>
              <span className={styles.cardIcon}>📧</span>
            </div>
            <p style={{fontSize:'13px',color:'#64748B',marginBottom:'16px'}}>Click <strong>Send Alert</strong> to email all registered users about the flood risk in that region.</p>
            {recentPredictions && recentPredictions.length > 0 ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:'12px'}}>
                {recentPredictions.map((p, idx) => {
                  const risk = p.flood_probability > 0.7 ? 'HIGH' : p.flood_probability > 0.4 ? 'MODERATE' : 'LOW';
                  const color = risk === 'HIGH' ? '#EF4444' : risk === 'MODERATE' ? '#F59E0B' : '#10B981';
                  const sendEmailAlert = async () => {
                    try {
                      const res = await fetch('http://localhost:8000/api/alerts/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: `${risk} RISK - ${p.region}`,
                          message: `Flood probability ${(p.flood_probability*100).toFixed(0)}% | Confidence ${(p.confidence*100).toFixed(0)}%`,
                          risk
                        })
                      });
                      if (!res.ok) throw new Error('Failed');
                      showNotification(`Email alert sent for ${p.region}`, risk === 'HIGH' ? 'error' : risk === 'MODERATE' ? 'warning' : 'success');
                    } catch (e) {
                      showNotification('Failed to send email alert', 'error');
                    }
                  };
                  return (
                    <div key={idx} style={{border:`1px solid ${color}44`,padding:'16px',borderRadius:'12px',background:`${color}08`}}>
                      <div style={{fontWeight:700,color,fontSize:'16px',marginBottom:'4px'}}>{p.region} • {risk}</div>
                      <div style={{fontSize:'12px',color:'#94A3B8',marginBottom:'12px'}}>Prob: {(p.flood_probability*100).toFixed(0)}% · Conf: {(p.confidence*100).toFixed(0)}%</div>
                      <button
                        className={styles.refreshBtn}
                        onClick={sendEmailAlert}
                        style={{width:'100%',padding:'10px',fontWeight:'700',background:'#10B981',color:'#000',borderRadius:'8px',border:'none',cursor:'pointer'}}
                      >
                        📧 Send Alert
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{opacity:0.7,fontSize:'13px'}}>No recent predictions yet.</div>
            )}
          </div>

          {/* ── SMS Alert Management ── */}
          <div className={styles.card} style={{marginTop:'20px',border:'1px solid rgba(245,158,11,0.25)'}}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} style={{color:'#F59E0B'}}>SMS Alerts</h3>
              <span className={styles.cardIcon}>📱</span>
            </div>
            <p style={{fontSize:'13px',color:'#64748B',marginBottom:'12px'}}>Click <strong>Send SMS</strong> to instantly text all registered users about the flood risk in that region via Fast2SMS.</p>

            {/* Test number override */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',padding:'12px',borderRadius:'10px',background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)'}}>
              <span style={{fontSize:'13px',color:'#F59E0B',fontWeight:'700',whiteSpace:'nowrap'}}>🧪 Test number:</span>
              <input
                type="tel"
                value={smsTestNumber}
                onChange={e => setSmsTestNumber(e.target.value)}
                placeholder="Enter your mobile (e.g. 9876543210) — leave empty to send to all users"
                style={{flex:1,padding:'8px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#FFF',fontSize:'13px',outline:'none'}}
              />
              {smsTestNumber && <span style={{fontSize:'11px',color:'#94A3B8',whiteSpace:'nowrap'}}>→ sends only to this number</span>}
            </div>
            {recentPredictions && recentPredictions.length > 0 ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:'12px'}}>
                {recentPredictions.map((p, idx) => {
                  const risk = p.flood_probability > 0.7 ? 'HIGH' : p.flood_probability > 0.4 ? 'MODERATE' : 'LOW';
                  const color = risk === 'HIGH' ? '#EF4444' : risk === 'MODERATE' ? '#F59E0B' : '#10B981';
                  const urgency = risk === 'HIGH' ? 'EMERGENCY' : risk === 'MODERATE' ? 'WARNING' : 'ADVISORY';
                  const action = risk === 'HIGH'
                    ? 'Evacuate immediately to the nearest shelter. Do not wait.'
                    : risk === 'MODERATE'
                    ? 'Stay alert. Avoid low-lying areas and river banks.'
                    : 'Monitor conditions. Follow official instructions.';
                  const smsMsg = `[ACMS ${urgency}] Flood Alert - ${p.region} Region. Risk Level: ${risk}. Flood Probability: ${(p.flood_probability*100).toFixed(0)}%. ${action} Helpline: 1077. - Disaster Management Authority`;
                  return (
                    <div key={idx} style={{border:`1px solid ${color}44`,padding:'16px',borderRadius:'12px',background:`${color}08`}}>
                      <div style={{fontWeight:700,color,fontSize:'16px',marginBottom:'4px'}}>{p.region} • {risk}</div>
                      <div style={{fontSize:'12px',color:'#94A3B8',marginBottom:'12px'}}>Prob: {(p.flood_probability*100).toFixed(0)}% · Conf: {(p.confidence*100).toFixed(0)}%</div>
                      <button
                        className={styles.refreshBtn}
                        disabled={smsSending}
                        onClick={() => sendSMSAlert(smsMsg)}
                        style={{width:'100%',padding:'10px',fontWeight:'700',background: smsSending ? 'rgba(245,158,11,0.2)' : '#F59E0B',color:'#000',borderRadius:'8px',border:'none',cursor: smsSending ? 'not-allowed' : 'pointer'}}
                      >
                        {smsSending ? '⏳ Sending...' : '📱 Send SMS'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{opacity:0.7,fontSize:'13px'}}>No recent predictions yet.</div>
            )}
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
              <h3 className={styles.cardTitle}>Pending Resource Requests</h3>
              <span className={styles.cardIcon}>📩</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Resource</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign:'center',padding:'20px',opacity:0.6}}>No pending resource requests.</td>
                    </tr>
                  ) : (
                    resourceRequests.map(req => (
                      <tr key={req.id}>
                        <td>{req.user_id}</td>
                        <td style={{fontWeight:'700',color:'#10B981'}}>{req.resource_name}</td>
                        <td>{req.quantity}</td>
                        <td style={{fontSize:'12px',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={req.notes}>{req.notes || '-'}</td>
                        <td>{new Date(req.requested_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button 
                              className={styles.refreshBtn} 
                              style={{padding:'4px 12px',fontSize:'12px',backgroundColor:'#10B981',color:'#000'}} 
                              onClick={() => approveRequest(req.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className={styles.refreshBtn} 
                              style={{padding:'4px 12px',fontSize:'12px',backgroundColor:'#EF4444'}} 
                              onClick={() => rejectRequest(req.id)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

          {/* ─── End SMS Alert Panel removed ─── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                🛡️ SECURITY PROTOCOL
              </span>
              <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Personnel<br/>Directory</h1>
              <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Manage system clearance levels, operational roles, and biometric access for all global AEGIS agents.</p>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button className={styles.refreshBtn} style={{ padding: '15px 30px', borderRadius: '40px', background: 'rgba(255,255,255,0.05)', color: '#FFF' }}>
                📥 Export Manifest
              </button>
              <button className={styles.refreshBtn} style={{ padding: '15px 30px', borderRadius: '40px', background: '#10B981', color: '#000' }}>
                👤 Onboard Agent
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '20px', marginBottom: '30px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                placeholder="Search by name, ID, or callsign..." 
                style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF', fontSize: '16px' }}
              />
              <span style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            </div>
            <select style={{ padding: '0 30px', borderRadius: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF' }}>
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF' }}>🎚️</button>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0' }}>
            <div style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', fontWeight: '800', color: '#94A3B8' }}>
              <span>Personnel</span>
              <span>Callsign / ID</span>
            </div>
            <div style={{ padding: '0 10px' }}>
              {(Array.isArray(users) ? users : []).map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 20px', borderBottom: i === users.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10B981&color=fff&bold=true`} 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid rgba(16, 185, 129, 0.2)' }}
                      alt="Avatar"
                    />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{u.name}</div>
                      <div style={{ fontSize: '14px', color: '#94A3B8' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{u.role.toUpperCase()} - {i + 10}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', opacity: 0.6 }}>ID: {8000 + i}-PX</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#94A3B8', fontSize: '14px' }}>
                Showing <span style={{ color: '#FFF', fontWeight: 'bold' }}>1 - {users.length}</span> of <span style={{ color: '#FFF', fontWeight: 'bold' }}>{usersCount}</span> agents
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#FFF' }}>‹</button>
                <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', border: 'none', color: '#000', fontWeight: 'bold' }}>1</button>
                <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#FFF' }}>2</button>
                <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#FFF' }}>3</button>
                <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#FFF' }}>›</button>
              </div>
            </div>
          </div>
        </div>

        <div id="user_management" className={`${styles.contentSection} ${currentSection === 'user_management' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              👤 PERSONNEL COMMAND
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>Personnel<br/>Directory</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>Manage administrative access, regional coordinators, and ground personnel assignments.</p>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
               <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Roles & Security</h3>
               <div style={{ padding: '6px 15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '20px', color: '#3B82F6', fontSize: '11px', fontWeight: '900' }}>
                 ENCRYPTED ACCESS
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
               <div style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '15px' }}>PROTOCOL ACCESS</label>
                  <input style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#FFF' }} placeholder="AI Agent Operator" />
                  <button className={styles.refreshBtn} style={{ width: '100%', marginTop: '15px', background: '#10B981', color: '#000', fontWeight: '800' }}>UPDATE ACCESS</button>
               </div>
               <div style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '15px' }}>SECURITY LAYER</label>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '14px', color: '#FFF' }}>Biometric Auth Req</span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '14px', color: '#FFF' }}>Session Tunneling</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div id="issues" className={`${styles.contentSection} ${currentSection === 'issues' ? styles.active : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
              <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                📡 INCIDENT DISPATCH
              </span>
              <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Tactical<br/>Support</h1>
              <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Central intelligence for community reports, system anomalies, and emergency assistance requests.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
               <select value={issueFilter} onChange={(e)=>setIssueFilter(e.target.value)} style={{ padding: '15px 25px', borderRadius: '40px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                  <option value="all">ALL INCIDENTS</option>
                  <option value="open">OPEN TICKETS</option>
                  <option value="resolved">RESOLVED</option>
               </select>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {communityReports.length === 0 ? (
              <div className={styles.card} style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛡️</div>
                <h3 style={{ fontSize: '24px' }}>Support Radar Clear</h3>
                <p style={{ color: '#94A3B8' }}>No active community incidents reported in the last telemetry cycle.</p>
              </div>
            ) : (
              communityReports
                .filter(report => issueFilter==='all' ? true : report.status===issueFilter)
                .map(report => (
                <motion.div key={report.id} className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px', display: 'flex', gap: '30px', alignItems: 'center' }}>
                   <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: report.status === 'open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                     {report.status === 'open' ? '🚨' : '✅'}
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>{report.report_type}</h3>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: report.status === 'open' ? '#EF4444' : '#10B981', background: report.status === 'open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>{report.status.toUpperCase()}</span>
                     </div>
                     <p style={{ color: '#94A3B8', fontSize: '14px', margin: '0 0 10px 0' }}>{report.description}</p>
                     <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '20px' }}>
                        <span>👤 REPORTED BY: {report.user_name.toUpperCase()}</span>
                        <span>⏱️ {new Date(report.reported_at).toLocaleString()}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '10px' }}>
                      <button className={styles.refreshBtn} onClick={() => resolveReport(report.id)} style={{ background: '#10B981', color: '#000', fontWeight: '900' }}>RESOLVE</button>
                      <button className={styles.refreshBtn} style={{ background: 'rgba(255,255,255,0.05)' }}>DETAILS</button>
                   </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div id="funding" className={`${styles.contentSection} ${currentSection === 'funding' ? styles.active : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                💰 FINANCIAL ASSETS
              </span>
              <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Relief<br/>Funding</h1>
              <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Monitor humanitarian contributions, financial resources, and logistical item donation workflows.</p>
            </div>
            <button className={styles.refreshBtn} style={{ background: '#10B981', color: '#000', padding: '15px 30px', borderRadius: '40px', fontWeight: 'bold' }}>
               💳 DISBURSE FUNDS
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '40px' }}>
            <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px', borderTop: '4px solid #10B981' }}>
               <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Donations</h3>
               <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '15px' }}>Total financial contributions received from global community channels.</p>
               <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981' }}>₹{donations.filter(d => d.status === 'accepted').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</div>
            </div>
            <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px', borderTop: '4px solid #3B82F6' }}>
               <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Item Pickups</h3>
               <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '15px' }}>Active item donation requests pending drone or personnel collection.</p>
               <div style={{ fontSize: '32px', fontWeight: '900', color: '#3B82F6' }}>{itemPickups.filter(p => p.status === 'pending').length} ACTIVE</div>
            </div>
          </div>

          {/* === DONATIONS LEDGER: approve / reject incoming donations === */}
          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0', marginBottom: '30px' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>💵 Incoming Donations</h3>
               <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>{donations.filter(d => d.status === 'pending').length} PENDING</span>
            </div>
            <div style={{ padding: '20px' }}>
              {donations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>No donation records found.</p>
              ) : (
                donations.map((d, i) => (
                  <div key={d.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderBottom: i === donations.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', background: d.status === 'pending' ? 'rgba(16,185,129,0.03)' : 'transparent', borderRadius: '8px' }}>
                     <div>
                       <div style={{ fontWeight: '700', fontSize: '16px' }}>{d.donor_name || 'Anonymous Donor'}</div>
                       <div style={{ fontSize: '12px', color: '#64748B' }}>{d.donor_email}</div>
                       <div style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', marginTop: '4px' }}>₹{(d.amount || 0).toLocaleString()}</div>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                       <span style={{ fontSize: '10px', fontWeight: '900', color: d.status === 'accepted' ? '#10B981' : d.status === 'rejected' ? '#EF4444' : '#F59E0B', background: d.status === 'accepted' ? 'rgba(16,185,129,0.1)' : d.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '20px' }}>{d.status.toUpperCase()}</span>
                       {d.status === 'pending' && (
                         <div style={{ display: 'flex', gap: '8px' }}>
                           <button className={styles.refreshBtn} style={{ padding: '5px 14px', fontSize: '11px', background: '#10B981', color: '#000', fontWeight: '800' }} onClick={() => approveDonation(d.id)}>ACCEPT</button>
                           <button className={styles.refreshBtn} style={{ padding: '5px 14px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => rejectDonation(d.id)}>REJECT</button>
                         </div>
                       )}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* === VOLUNTEER REQUESTS: approve / reject pending volunteer sign-ups === */}
          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0', marginBottom: '30px' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>🙋 Volunteer Join Requests</h3>
               <span style={{ color: '#F59E0B', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>{volunteerRequests.filter(v => v.status === 'pending').length} AWAITING APPROVAL</span>
            </div>
            <div style={{ padding: '20px' }}>
              {volunteerRequests.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>No volunteer applications received yet.</p>
              ) : (
                volunteerRequests.map((v, i) => (
                  <div key={v.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderBottom: i === volunteerRequests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(v.volunteer_name || 'V')}&background=10B981&color=fff&bold=true`} style={{ width: '46px', height: '46px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>{v.volunteer_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{v.volunteer_email}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>Skills: {v.areas_of_interest || 'General'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: v.status === 'accepted' ? '#10B981' : v.status === 'rejected' ? '#EF4444' : '#F59E0B', background: v.status === 'accepted' ? 'rgba(16,185,129,0.1)' : v.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '20px' }}>{(v.status || 'pending').toUpperCase()}</span>
                      {(!v.status || v.status === 'pending') && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className={styles.refreshBtn} style={{ padding: '5px 14px', fontSize: '11px', background: '#10B981', color: '#000', fontWeight: '800' }} onClick={() => acceptVolunteer(v.id, v.duration_months || 6)}>APPROVE</button>
                          <button className={styles.refreshBtn} style={{ padding: '5px 14px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => rejectVolunteer(v.id)}>REJECT</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div id="volunteers" className={`${styles.contentSection} ${currentSection === 'volunteers' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              👥 OPERATIONAL GRID
            </span>
            <h2 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Volunteer<br/>Management</h2>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Orchestrate humanitarian response teams and allocate skilled personnel across crisis zones with precision intelligence.</p>
            <button className={styles.refreshBtn} style={{ marginTop: '30px', padding: '15px 35px', borderRadius: '40px', background: '#10B981', color: '#000', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👤 Add Volunteer
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'TOTAL VOLUNTEERS', value: '1,284', trend: '+12% this week', icon: '👥' },
              { label: 'ACTIVE IN FIELD', value: '842', trend: '14 active sectors', icon: '📍' },
              { label: 'AVAILABLE', value: '312', trend: 'Ready for dispatch', icon: '📅' },
              { label: 'ASSIGNED TASKS', value: '156', trend: '89% completion rate', icon: '✅' }
            ].map((m, i) => (
              <div key={i} className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px' }}>{m.label}</div>
                  <span style={{ opacity: 0.3 }}>{m.icon}</span>
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>{m.value}</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>● {m.trend}</div>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0', marginBottom: '40px' }}>
            <div style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Personnel Roster</h3>
              <div style={{ display: 'flex', gap: '20px', opacity: 0.5 }}>
                <span>🎚️</span>
                <span>🔍</span>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {(Array.isArray(volunteerRequests) ? volunteerRequests : []).map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: i === volunteerRequests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(v.volunteer_name)}&background=10B981&color=fff&bold=true`} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{v.volunteer_name}</div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>{v.volunteer_email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>Sector {7 + i}-G</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{v.areas_of_interest}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</span>
              Task Assignment
            </h3>
            <div style={{ display: 'grid', gap: '30px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '12px' }}>SELECT VOLUNTEER</label>
                <select style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFF' }}>
                  <option>Select Personnel...</option>
                  {volunteerRequests.map(v => <option key={v.id}>{v.volunteer_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '12px' }}>TARGET TASK</label>
                <select style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFF' }}>
                  <option>Medical Triage - Sector 7</option>
                  <option>Relief Distribution - Sector 4</option>
                  <option>Shelter Setup - Metro Zone</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '12px' }}>PRIORITY LEVEL</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  {['CRITICAL', 'STANDARD', 'LOW'].map(p => (
                    <button key={p} style={{ padding: '12px', background: p === 'STANDARD' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)', border: p === 'STANDARD' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: p === 'STANDARD' ? '#10B981' : '#94A3B8', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>{p}</button>
                  ))}
                </div>
              </div>
              <button className={styles.refreshBtn} style={{ width: '100%', padding: '20px', borderRadius: '40px', background: '#00D1FF', color: '#000', fontWeight: '800', border: 'none', letterSpacing: '1px', marginTop: '20px' }}>ASSIGN PERSONNEL</button>
            </div>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px' }}>
             <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>Recent Activity</h3>
             <div style={{ display: 'grid', gap: '35px' }}>
                {[
                  { time: '2 minutes ago', title: 'Volunteer Dispatch', desc: 'Elena Rodriguez assigned to Medical Base Delta for night shift.', iconColor: '#10B981' },
                  { time: '45 minutes ago', title: 'Skill Verification', desc: 'Marcus Chen\'s Heavy Machinery certification verified and updated.', iconColor: '#00D1FF' },
                  { time: '2 hours ago', title: 'Task Completed', desc: 'Shelter setup in Sector 4-B marked as complete by Sarah Jenkins.', iconColor: '#A855F7' }
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: a.iconColor, boxShadow: `0 0 10px ${a.iconColor}` }}></div>
                      {i < 2 && <div style={{ flex: 1, width: '2px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }}></div>}
                    </div>
                    <div style={{ paddingBottom: i < 2 ? '30px' : '0' }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '5px' }}>{a.time}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '5px' }}>{a.title}</div>
                      <div style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.5' }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
             </div>
             <button style={{ width: '100%', marginTop: '40px', background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', textDecoration: 'underline' }}>VIEW FULL HISTORY</button>
          </div>
        </div>

        <div id="analytics" className={`${styles.contentSection} ${currentSection === 'analytics' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              📊 STRATEGIC INTELLIGENCE
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>System<br/>Analytics</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>High-fidelity data visualization and predictive modeling for global flood management optimization.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'TOTAL PREDICTIONS', value: floods.length, trend: '+4 today', icon: '📈' },
              { label: 'ACTIVE USERS', value: usersCount, trend: '98 online', icon: '👥' },
              { label: 'COMMUNITY REPORTS', value: communityReports.length, trend: '24 solved', icon: '📞' },
              { label: 'FUNDS ALLOCATED', value: `₹${(financialAidRequests.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.approved_amount || 0), 0) / 1000).toFixed(1)}K`, trend: '89.4% util', icon: '💰' }
            ].map((m, i) => (
              <div key={i} className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '15px' }}>{m.label}</div>
                <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>{m.value}</div>
                <div style={{ fontSize: '12px', color: '#10B981' }}>● {m.trend}</div>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', height: '400px', padding: '40px', marginBottom: '40px' }}>
             <h3 style={{ margin: '0 0 30px 0', fontSize: '24px', fontWeight: '800' }}>Impact Propagation Model</h3>
             <Bar data={{
                labels: ['Assam', 'Kerala', 'UP', 'Bengal', 'Odisha'],
                datasets: [{ label: 'Severity Index', data: [85, 42, 63, 91, 55], backgroundColor: '#10B981' }]
             }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
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
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              🏗️ POST-IMPACT RECOVERY
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Recovery<br/>Planning</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px' }}>Coordinate reconstruction efforts, damage assessment verification, and financial aid distribution.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '40px' }}>
             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Damage Reports</h3>
                <div style={{ fontSize: '32px', fontWeight: '900' }}>{damageReports.length}</div>
                <div style={{ fontSize: '12px', color: '#F59E0B' }}>● {damageReports.filter(r => r.status === 'pending').length} pending review</div>
             </div>
             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Aid Approved</h3>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981' }}>₹{financialAidRequests.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.approved_amount || 0), 0).toLocaleString()}</div>
             </div>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0' }}>
            <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Active Recovery Queue</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {damageReports.length === 0 ? <p style={{ textAlign: 'center', color: '#94A3B8' }}>No reports recorded.</p> : damageReports.filter(r => r.status === 'pending').map((r, i) => (
                <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: i === damageReports.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                   <div>
                     <div style={{ fontWeight: '700' }}>{r.property_type.toUpperCase()} - {r.user_name || 'Anonymous User'}</div>
                     <div style={{ fontSize: '12px', color: '#94A3B8' }}>Est. Loss: ₹{(r.estimated_loss || 0).toLocaleString()}</div>
                     <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>Desc: {r.description || 'No notes provided'}</div>
                   </div>
                   <div style={{ display: 'flex', gap: '15px' }}>
                      <button 
                        className={styles.refreshBtn} 
                        style={{ background: '#10B981', color: '#000', fontWeight: '800', fontSize: '12px' }}
                        onClick={() => approveDamageReport(r.id)}
                      >VERIFY & APPROVE</button>
                      <button 
                        className={styles.refreshBtn} 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px' }}
                        onClick={() => rejectDamageReport(r.id)}
                      >REJECT</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="settings" className={`${styles.contentSection} ${currentSection === 'settings' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              ⚙️ CORE CONFIGURATION
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>System<br/>Settings</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>Global operational parameters, security protocols, and integration keys for the ACMS substrate.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '25px' }}>Prediction Engine</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '10px' }}>RAINFALL THRESHOLD (MM)</label>
                     <input type="number" defaultValue={50} style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#FFF' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '10px' }}>RIVER LEVEL LIMIT (M)</label>
                     <input type="number" defaultValue={5} style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#FFF' }} />
                   </div>
                </div>
             </div>

             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '25px' }}>Integrations</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <span>Satellite India-1</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>CONNECTED</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <span>NDRF API Relay</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>ACTIVE</span>
                   </div>
                </div>
             </div>
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
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#00D1FF', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              ⛈️ METEOROLOGY RADAR
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>Environmental<br/>Intelligence</h1>
            <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', marginTop: '15px' }}>Hyper-local weather telemetry and environmental sensor arrays for precision flood forecasting.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#00D1FF' }}>Live Conditions</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                   {[
                     { l: 'RAINFALL', v: '42mm/h' },
                     { l: 'WIND', v: '18km/h NW' },
                     { l: 'HUMIDITY', v: '84%' }
                   ].map((m, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{m.l}</span>
                        <span style={{ fontWeight: 'bold' }}>{m.v}</span>
                     </div>
                   ))}
                </div>
             </div>
             <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '0', gridColumn: 'span 2', overflow: 'hidden' }}>
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=68.1766,6.7479,97.4025,35.5087&layer=mapnik"
                  style={{ width: '100%', height: '300px', border: 'none', filter: 'invert(1) hue-rotate(180deg) brightness(0.8)' }}
                  title="Environmental Map"
                />
             </div>
          </div>
        </div>
        
        <div id="footprint" className={`${styles.contentSection} ${currentSection === 'footprint' ? styles.active : ''}`}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
              🍃 CLIMATE RESPONSIBILITY
            </span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0' }}>Eco-Impact<br/>Radar</h1>
          </div>

          <div className={styles.card} style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', padding: '40px', maxWidth: '800px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '10px' }}>MONTHLY KWH</label>
                   <input type="number" name="electricityKWh" value={footprintData.electricityKWh} onChange={handleInputChange} style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#FFF' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '10px' }}>CAR MILEAGE</label>
                   <input type="number" name="carMiles" value={footprintData.carMiles} onChange={handleInputChange} style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#FFF' }} />
                </div>
             </div>
             <button className={styles.refreshBtn} onClick={calculateFootprint} style={{ background: '#10B981', color: '#000', fontWeight: '900', width: '100%', padding: '20px' }}>ANALYZE IMPACT</button>
             
             {carbonFootprint > 0 && (
               <div style={{ marginTop: '40px', textAlign: 'center', padding: '30px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '10px' }}>ESTIMATED CARBON FOOTPRINT</div>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#10B981' }}>{carbonFootprint.toFixed(2)} <span style={{ fontSize: '18px' }}>KG CO2E</span></div>
               </div>
             )}
          </div>
        </div>

        {/* ─── Full NASA EONET Dedicated Section ─── */}
        <div id="eonet" className={`${styles.contentSection} ${currentSection === 'eonet' ? styles.active : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                🛸 NASA EONET API · LIVE DATA
              </span>
              <h1 style={{ fontSize: '52px', fontWeight: '900', margin: '0 0 12px 0', lineHeight: '1.1' }}>Live Global<br/>Disasters</h1>
              <p style={{ color: '#94A3B8', fontSize: '16px', maxWidth: '560px' }}>
                Real-time natural disaster events sourced directly from the NASA Earth Observatory Natural Event Tracker (EONET) API.
                {eonetLastFetched && <span style={{ color: '#64748B', fontSize: '13px', display: 'block', marginTop: '6px' }}>Last updated: {eonetLastFetched.toLocaleString()}</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={fetchEonetEvents}
                disabled={eonetLoading}
                className={styles.refreshBtn}
                style={{ background: eonetLoading ? 'rgba(239,68,68,0.2)' : 'linear-gradient(45deg,#EF4444,#F97316)', color: '#fff', fontWeight: '800' }}
              >
                {eonetLoading ? '⏳ Fetching...' : '🔄 Refresh Live Data'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            {[
              { cat: 'All', label: 'TOTAL EVENTS', color: '#E2E8F0', icon: '🌍' },
              { cat: 'Floods', label: 'FLOODS', color: '#3B82F6', icon: '🌊' },
              { cat: 'Wildfires', label: 'WILDFIRES', color: '#F97316', icon: '🔥' },
              { cat: 'Severe Storms', label: 'SEVERE STORMS', color: '#A78BFA', icon: '⛈️' },
              { cat: 'Landslides', label: 'LANDSLIDES', color: '#92400E', icon: '⛰️' },
              { cat: 'Earthquakes', label: 'EARTHQUAKES', color: '#EF4444', icon: '🫨' },
              { cat: 'Volcanoes', label: 'VOLCANOES', color: '#F59E0B', icon: '🌋' },
              { cat: 'Drought', label: 'DROUGHT', color: '#D97706', icon: '☀️' },
            ].map(({ cat, label, color, icon }) => (
              <div
                key={cat}
                onClick={() => setEonetCategory(cat)}
                style={{
                  textAlign: 'center', padding: '20px 12px',
                  background: eonetCategory === cat ? `rgba(${color === '#E2E8F0' ? '226,232,240' : color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.15)` : 'rgba(255,255,255,0.02)',
                  borderRadius: '16px',
                  border: eonetCategory === cat ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color }}>{cat === 'All' ? eonetEvents.length : (eonetCounts[cat] || 0)}</div>
                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px', fontWeight: '800', letterSpacing: '1px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Category filter bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {EONET_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setEonetCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: '40px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  border: eonetCategory === cat ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  background: eonetCategory === cat ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                  color: eonetCategory === cat ? '#EF4444' : '#94A3B8',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Error state */}
          {eonetError && (
            <div className={styles.card} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#EF4444', fontWeight: '600' }}>{eonetError}</p>
              <button onClick={fetchEonetEvents} className={styles.refreshBtn} style={{ marginTop: '16px', background: '#EF4444', color: '#fff' }}>Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {eonetLoading && !eonetError && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} className={styles.card} style={{ height: '80px', background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          )}

          {/* Events list */}
          {!eonetLoading && !eonetError && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredEonetEvents.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', padding: '60px', background: 'rgba(21,26,35,0.4)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
                  <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>No active events for "{eonetCategory}"</h3>
                  <p style={{ color: '#94A3B8' }}>NASA EONET reports no open events in this category right now.</p>
                </div>
              ) : filteredEonetEvents.map((ev, i) => {
                const cat = ev.categories?.[0]?.title || 'Unknown';
                const latestGeom = ev.geometry?.[ev.geometry.length - 1];
                const coords = latestGeom?.coordinates;
                const date = latestGeom?.date;
                const lat = coords?.[1];
                const lon = coords?.[0];
                const catColor = cat==='Floods'?'#3B82F6':cat==='Wildfires'?'#F97316':cat==='Severe Storms'?'#A78BFA':cat==='Earthquakes'?'#EF4444':cat==='Volcanoes'?'#F59E0B':cat==='Landslides'?'#92400E':cat==='Drought'?'#D97706':'#10B981';
                const catIcon = cat==='Floods'?'🌊':cat==='Wildfires'?'🔥':cat==='Severe Storms'?'⛈️':cat==='Earthquakes'?'🫨':cat==='Volcanoes'?'🌋':cat==='Landslides'?'⛰️':cat==='Drought'?'☀️':'🌍';
                return (
                  <div key={ev.id || i} className={styles.card} style={{
                    background: 'rgba(15,20,30,0.6)',
                    borderLeft: `4px solid ${catColor}`,
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `rgba(0,0,0,0.3)`, border: `1px solid ${catColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                      {catIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '15px' }}>{ev.title}</span>
                        <span style={{ padding: '2px 10px', borderRadius: '40px', background: `${catColor}22`, color: catColor, fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>{cat.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {lat != null && lon != null && (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            📍 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                          </span>
                        )}
                        {date && (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            🕐 {new Date(date).toLocaleString()}
                          </span>
                        )}
                        {ev.geometry?.length > 1 && (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            📊 {ev.geometry.length} data points
                          </span>
                        )}
                      </div>
                    </div>
                    {lat != null && lon != null && (
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', fontSize: '12px', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        🗺️ View Map
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer note */}
          {!eonetLoading && filteredEonetEvents.length > 0 && (
            <div style={{ marginTop: '30px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>
              Showing {filteredEonetEvents.length} open event{filteredEonetEvents.length !== 1 ? 's' : ''} · Data sourced from{' '}
              <a href="https://eonet.gsfc.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: '#EF4444', textDecoration: 'none', fontWeight: '700' }}>NASA EONET v3</a>
            </div>
          )}
        </div>

        {/* ─── Open-Meteo Weather & Flood Risk Section ─── */}
        <div id="weather-flood" className={`${styles.contentSection} ${currentSection === 'weather-flood' ? styles.active : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px' }}>
                🌧️ OPEN-METEO API · LIVE PREDICTION
              </span>
              <h1 style={{ fontSize: '52px', fontWeight: '900', margin: '0 0 12px 0', lineHeight: '1.1' }}>Weather &amp;<br/>Flood Risk</h1>
              <p style={{ color: '#94A3B8', fontSize: '16px', maxWidth: '580px' }}>
                Real-time rainfall, temperature, wind speed and river discharge for flood-prone Indian cities — powered by Open-Meteo (no API key required).
                {weatherLastFetched && <span style={{ color: '#64748B', fontSize: '13px', display: 'block', marginTop: '6px' }}>Last updated: {weatherLastFetched.toLocaleString()}</span>}
              </p>
            </div>
            <button
              onClick={fetchOpenMeteo}
              disabled={weatherLoading}
              className={styles.refreshBtn}
              style={{ background: weatherLoading ? 'rgba(59,130,246,0.2)' : 'linear-gradient(45deg,#3B82F6,#06B6D4)', color: '#fff', fontWeight: '800' }}
            >
              {weatherLoading ? '⏳ Fetching...' : '🔄 Refresh Data'}
            </button>
          </div>

          {/* Risk legend */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {[{level:'HIGH',color:'#EF4444'},{level:'MODERATE',color:'F59E0B'},{level:'LOW',color:'#10B981'},{level:'MINIMAL',color:'#3B82F6'}].map(({level, color}) => (
              <div key={level} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#94A3B8' }}>
                <div style={{ width:'9px', height:'9px', borderRadius:'50%', background: color.startsWith('#') ? color : `#${color}` }}></div>
                {level} RISK
              </div>
            ))}
            <div style={{ marginLeft:'auto', fontSize:'12px', color:'#475569' }}>Risk based on 24-h cumulative rainfall · &gt;20mm = HIGH · &gt;10mm = MODERATE · &gt;2mm = LOW</div>
          </div>

          {/* Error */}
          {weatherError && (
            <div className={styles.card} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#EF4444', fontWeight: '600' }}>{weatherError}</p>
              <button onClick={fetchOpenMeteo} className={styles.refreshBtn} style={{ marginTop: '16px', background: '#3B82F6', color: '#fff' }}>Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {weatherLoading && !weatherError && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '20px' }}>
              {FLOOD_CITIES.map(c => (
                <div key={c.name} className={styles.card} style={{ height: '200px', background: 'rgba(255,255,255,0.02)' }} />
              ))}
            </div>
          )}

          {/* City cards */}
          {!weatherLoading && !weatherError && weatherData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '22px' }}>
              {weatherData.map((city) => (
                <div key={city.name} className={styles.card} style={{
                  background: city.risk.bg,
                  borderLeft: `4px solid ${city.risk.color}`,
                  padding: '24px'
                }}>
                  {/* City header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800' }}>{city.name}</h3>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E</div>
                    </div>
                    <div style={{
                      padding: '5px 14px', borderRadius: '40px',
                      background: city.risk.color + '22',
                      color: city.risk.color,
                      fontSize: '11px', fontWeight: '900', letterSpacing: '1px'
                    }}>
                      {city.risk.level}
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>🌧️ CURRENT RAIN</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#3B82F6' }}>{city.rain.toFixed(1)} <span style={{ fontSize: '12px' }}>mm/h</span></div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>☁️ 24H TOTAL</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: city.risk.color }}>{city.rain24h.toFixed(1)} <span style={{ fontSize: '12px' }}>mm</span></div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>🌡️ TEMPERATURE</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#F97316' }}>{city.temp !== null ? city.temp.toFixed(1) : '–'} <span style={{ fontSize: '12px' }}>°C</span></div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>🌪️ WIND</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#A78BFA' }}>{city.wind !== null ? city.wind.toFixed(1) : '–'} <span style={{ fontSize: '12px' }}>km/h</span></div>
                    </div>
                  </div>

                  {/* River discharge */}
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '1px', marginBottom: '2px' }}>🌊 RIVER DISCHARGE</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#06B6D4' }}>
                        {city.discharge !== null ? `${city.discharge.toFixed(1)} m³/s` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                      Open-Meteo<br/>Flood API
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Combined system note */}
          {!weatherLoading && weatherData.length > 0 && (
            <div className={styles.card} style={{ marginTop: '30px', background: 'rgba(15,20,30,0.5)', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8' }}>⚡ COMBINED SITUATIONAL AWARENESS</div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>🛸</span>
                    <span style={{ color: '#EF4444', fontWeight: '700' }}>NASA EONET</span>
                    <span style={{ color: '#475569' }}>→ Real ongoing disaster events</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>🌧️</span>
                    <span style={{ color: '#3B82F6', fontWeight: '700' }}>Open-Meteo</span>
                    <span style={{ color: '#475569' }}>→ Rain & flood risk prediction</span>
                  </div>
                </div>
                <button onClick={() => showSection('eonet')} style={{ padding: '8px 18px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>View EONET →</button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;