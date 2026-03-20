import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './resource-allocation.module.css';
import io from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ResourceAllocation() {
  const [allocationData, setAllocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [resourceType, setResourceType] = useState('food');
  const [quantity, setQuantity] = useState(0);
  const [evacuationPlan, setEvacuationPlan] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [priorityScore, setPriorityScore] = useState(0);

  useEffect(() => {
    const socket = io('http://localhost:8000', { transports: ['websocket'] });

    socket.on('connect', () => {
      socket.emit('subscribe', 'resource-allocation');
    });

    socket.on('dashboard-update', (data) => {
      const disasters = data.disasters || [];
      const updatedData = disasters.map(disaster => ({
        region: disaster.location,
        severity: disaster.severity,
        displacedPeople: disaster.displacedPeople,
        recoveryCost: disaster.recoveryCost,
        requiredResources: disaster.requiredResources,
        allocatedResources: calculateAllocatedResources(disaster),
        priority: calculatePriorityScore(disaster),
      }));
      setAllocationData(updatedData);
      setLoading(false);
    });

    socket.on('alert', (data) => {
      setAlerts(prev => [...prev, { id: Date.now(), message: data.message, type: data.type }]);
      toast.info(`Alert: ${data.message} (${data.type})`);
    });

    socket.on('resource-update', (data) => {
      toast.success(`Resource update: ${data.message}`);
      setAllocationData(prev => prev.map(d => 
        d.region === data.region ? { ...d, allocatedResources: data.resources } : d
      ));
    });

    socket.on('connect_error', (err) => console.error('SocketIO connection error:', err));

    return () => socket.disconnect();
  }, []);

  const calculateAllocatedResources = (disaster) => {
    const baseAllocation = {
      food: 500, water: 800, medical: 200, shelter: 100,
      boats: 20, helicopters: 5, sandbags: 1000, pumps: 50, buses: 10,
    };
    const severityFactor = { low: 1, moderate: 1.5, high: 2 }[disaster.severity] || 1;
    const populationFactor = Math.min(disaster.displacedPeople / 1000, 2);
    return Object.fromEntries(
      Object.entries(baseAllocation).map(([key, value]) => [
        key, Math.round(value * severityFactor * populationFactor),
      ])
    );
  };

  const calculatePriorityScore = (disaster) => {
    const severityWeight = { low: 1, moderate: 2, high: 3 }[disaster.severity] || 1;
    const populationWeight = Math.log10(disaster.displacedPeople + 1) / 3;
    const costWeight = Math.log10(disaster.recoveryCost + 1) / 6;
    return Math.round((severityWeight + populationWeight + costWeight) * 100 / 7);
  };

  const handleAllocate = async () => {
    if (!selectedRegion || !quantity || quantity <= 0) {
      toast.error('Please select a region and enter a valid quantity');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/allocate-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion, resourceType, quantity }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Allocated ${quantity} ${resourceType} to ${selectedRegion}`);
      } else {
        toast.error(result.detail || 'Allocation failed');
      }
    } catch (error) {
      toast.error('Error allocating resources');
      console.error(error);
    }
  };

  const handleRequestAid = async (region) => {
    try {
      const response = await fetch(`http://localhost:8000/api/request-aid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Aid requested for ${region}`);
      } else {
        toast.error(result.detail || 'Aid request failed');
      }
    } catch (error) {
      toast.error('Error requesting aid');
      console.error(error);
    }
  };

  const handleDispatchTeam = async (region) => {
    try {
      const response = await fetch(`http://localhost:8000/api/dispatch-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Team dispatched to ${region}`);
      } else {
        toast.error(result.detail || 'Dispatch failed');
      }
    } catch (error) {
      toast.error('Error dispatching team');
      console.error(error);
    }
  };

  const generateEvacuationPlan = (regionData) => {
    const { displacedPeople, severity } = regionData;
    const safeZones = ['Zone A', 'Zone B', 'Zone C'];
    const busesNeeded = Math.ceil(displacedPeople / 50);
    const plan = {
      region: regionData.region,
      displacedPeople,
      severity,
      safeZones,
      busesNeeded,
      estimatedTime: severity === 'high' ? '12 hours' : '24 hours',
      instructions: `Evacuate ${displacedPeople} people to ${safeZones.join(', ')} using ${busesNeeded} buses. Priority for high-risk areas.`,
    };
    setEvacuationPlan(plan);
  };

  const chartData = {
    labels: allocationData.map(d => d.region),
    datasets: [
      {
        label: 'Priority Score',
        data: allocationData.map(d => d.priority),
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Priority Scores by Region' } },
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <span>🌱</span>
            <span>Resource Allocation</span>
          </div>
          <a href="/recovery-dashboard" className={styles.navLink}>← Back to Dashboard</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Resource Allocation Dashboard</h1>
        <p className={styles.heroText}>
          Optimize resource distribution and manage flood-affected regions with real-time insights.
        </p>
      </section>

      <section className={styles.allocationControls}>
        <h2 className={styles.sectionTitle}>Allocate Resources <span>📊</span></h2>
        <div className={styles.controlGroup}>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className={styles.select}>
            <option value="">Select Region</option>
            <option value="Kerala">Kerala</option>
            <option value="Assam">Assam</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
          </select>
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className={styles.select}>
            <option value="food">Food</option>
            <option value="water">Water</option>
            <option value="medical">Medical Aid</option>
            <option value="shelter">Shelter</option>
            <option value="boats">Rescue Boats</option>
            <option value="helicopters">Helicopters</option>
            <option value="sandbags">Sandbags</option>
            <option value="pumps">Pumps</option>
            <option value="buses">Evacuation Buses</option>
          </select>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className={styles.input}
            placeholder="Quantity"
            min="0"
          />
          <button onClick={handleAllocate} className={styles.button}>Allocate Resources</button>
        </div>
      </section>

      {loading ? (
        <div className={styles.loading}>Loading allocation data...</div>
      ) : (
        <>
          <section className={styles.allocationOverview}>
            <h2 className={styles.sectionTitle}>Resource Allocation Overview <span>🌍</span></h2>
            <div className={styles.grid}>
              {allocationData.map((data) => (
                <div key={data.region} className={styles.card}>
                  <h3 className={styles.cardTitle}>{data.region}</h3>
                  <p><strong>Severity:</strong> <span className={styles[data.severity]}>{data.severity.toUpperCase()}</span></p>
                  <p><strong>Displaced People:</strong> {data.displacedPeople.toLocaleString()}</p>
                  <p><strong>Recovery Cost:</strong> ${data.recoveryCost.toLocaleString()}</p>
                  <p><strong>Priority Score:</strong> {data.priority}</p>
                  <div className={styles.resourceList}>
                    <h4>Allocated Resources:</h4>
                    {Object.entries(data.allocatedResources).map(([resource, amount]) => (
                      <p key={resource}>{resource.charAt(0).toUpperCase() + resource.slice(1)}: {amount}</p>
                    ))}
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => handleRequestAid(data.region)} className={styles.actionButton}>
                      Request Aid
                    </button>
                    <button onClick={() => handleDispatchTeam(data.region)} className={styles.actionButton}>
                      Dispatch Team
                    </button>
                    <button onClick={() => generateEvacuationPlan(data)} className={styles.actionButton}>
                      Plan Evacuation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.allocationOverview}>
            <h2 className={styles.sectionTitle}>Priority Visualization <span>📈</span></h2>
            <div style={{ width: '100%', height: '350px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </section>

          {evacuationPlan && (
            <section className={styles.allocationOverview}>
              <h2 className={styles.sectionTitle}>Evacuation Plan <span>🚒</span></h2>
              <div className={styles.card}>
                <p><strong>Region:</strong> {evacuationPlan.region}</p>
                <p><strong>Displaced People:</strong> {evacuationPlan.displacedPeople.toLocaleString()}</p>
                <p><strong>Severity:</strong> {evacuationPlan.severity}</p>
                <p><strong>Safe Zones:</strong> {evacuationPlan.safeZones.join(', ')}</p>
                <p><strong>Buses Needed:</strong> {evacuationPlan.busesNeeded}</p>
                <p><strong>Estimated Time:</strong> {evacuationPlan.estimatedTime}</p>
                <p><strong>Instructions:</strong> {evacuationPlan.instructions}</p>
              </div>
            </section>
          )}

          <section className={styles.benefits}>
            <h2 className={styles.sectionTitle}>Active Alerts <span>🔔</span></h2>
            <div className={styles.grid}>
              {alerts.map(alert => (
                <div key={alert.id} className={`${styles.card} ${styles[alert.type === 'warning' ? 'moderateRisk' : alert.type === 'error' ? 'highRisk' : 'lowRisk']}`}>
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className={styles.benefits}>
        <h2 className={styles.sectionTitle}>Benefits of Resource Allocation <span>🌱</span></h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <h3>For Affected People</h3>
            <ul>
              <li><strong>Faster Relief:</strong> Immediate dispatch of essentials.</li>
              <li><strong>Safety:</strong> Evacuation plans and rescue operations.</li>
              <li><strong>Support:</strong> Tailored aid based on severity.</li>
            </ul>
          </div>
          <div className={styles.benefitCard}>
            <h3>For Disaster Teams</h3>
            <ul>
              <li><strong>Efficiency:</strong> Prioritized resource deployment.</li>
              <li><strong>Coordination:</strong> Real-time updates and alerts.</li>
              <li><strong>Planning:</strong> Data-driven evacuation strategies.</li>
            </ul>
          </div>
          <div className={styles.benefitCard}>
            <h3>For Policy Makers</h3>
            <ul>
              <li><strong>Cost Management:</strong> Optimized resource allocation.</li>
              <li><strong>Preparedness:</strong> Proactive disaster response.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}