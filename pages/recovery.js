import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './recovery-agent.module.css';
import io from 'socket.io-client';

export default function RecoverySupportAgent() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io('http://localhost:8000', { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('SocketIO connected');
      socket.emit('subscribe', 'recovery-dashboard');
    });

    socket.on('dashboard-update', (data) => {
      setDashboardData(data.disasters);
      setLoading(false);
      console.log('Real-time Dashboard Data:', data.disasters);
    });

    socket.on('alert', (data) => {
      toast.info(`New Alert: ${data.message} (${data.type})`);
    });

    socket.on('connect_error', (err) => console.error('SocketIO connection error:', err));

    return () => socket.disconnect();
  }, []);

  const getColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#f44336';
      case 'moderate':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#666666';
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <span>🛠️</span>
            <span>Recovery Support Agent</span>
          </div>
          <a href="/" className={styles.navLink}>
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>AI-Powered Recovery Support</h2>
        <p className={styles.heroText}>
          Estimate impact, assess damage, and plan recovery for flood disasters using Random Forest predictions.
        </p>
      </section>

      {/* Dashboard Data */}
      {loading ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading recovery data...
        </div>
      ) : (
        dashboardData && dashboardData.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Active Disasters Recovery Overview</h3>
            <div className={styles.historyContainer}>
              {dashboardData.map((item, index) => (
                <div key={index} className={styles.historyItem} style={{ backgroundColor: getColor(item.severity) }}>
                  <div className={styles.historyHeader}>
                    <span>{item.location} - Severity: {item.severity.toUpperCase()}</span>
                  </div>
                  <div className={styles.historyDetails}>
                    Recovery Cost: ${item.recovery_cost.toLocaleString()}
                  </div>
                  <div className={styles.historyDetails}>
                    Displaced People: {item.displaced_people.toLocaleString()}
                  </div>
                  <div className={styles.historyDetails}>
                    Required Resources: {item.required_resources}
                  </div>
                  <div className={styles.historyDetails}>
                    Damaged Area: {item.damaged_area_percentage.toFixed(2)}%
                  </div>
                  <div className={styles.historyDetails}>
                    Recovery Strategy: {item.recovery_strategy}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      )}

      {/* Recovery Methods */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>General Recovery Methods</h3>
        <ul className={styles.recoveryList}>
          <li>Immediate Relief: Provide food, water, and medical aid.</li>
          <li>Infrastructure Rebuilding: Repair roads, bridges, and buildings.</li>
          <li>Community Support: Offer housing and counseling for displaced people.</li>
          <li>Economic Aid: Distribute funds based on estimated costs.</li>
          <li>Prevention: Install flood barriers and early warning systems.</li>
        </ul>
      </section>
    </div>
  );
}