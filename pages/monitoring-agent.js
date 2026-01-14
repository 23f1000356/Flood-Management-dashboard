import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './monitoring-agent.module.css';
import io from 'socket.io-client';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function MonitoringAgent() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState(null);
  const [externalSources, setExternalSources] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [modelStats, setModelStats] = useState(null);
  const [loading, setLoading] = useState({
    status: false,
    metrics: false,
    reports: false,
    sources: false,
    alerts: false,
    model: false,
  });

  useEffect(() => {
    loadSystemStatus();
    loadMetrics();
    loadReports();
    loadExternalSources();
    loadAlerts();
    loadModelStats();

    const socket = io('http://localhost:8000', { transports: ['websocket'] });
    socket.on('connect', () => console.log('SocketIO connected'));
    socket.on('alert', (data) => {
      toast.info(`New Alert: ${data.message} (${data.type})`);
      setAlerts((prev) => [...prev, { ...data, time: new Date().toISOString() }]);
    });
    socket.on('new_prediction', (data) => {
      toast.info(`New Prediction: ${data.region} - ${data.risk_level.toUpperCase()} Risk`);
      setReports((prev) => {
        if (!prev) return prev;
        const updated = { ...prev.region_summary };
        if (!updated[data.region]) {
          updated[data.region] = { high_risk_count: 0, moderate_risk_count: 0, low_risk_count: 0, latest_prediction: null };
        }
        if (data.risk_level === 'high') updated[data.region].high_risk_count += 1;
        else if (data.risk_level === 'moderate') updated[data.region].moderate_risk_count += 1;
        else updated[data.region].low_risk_count += 1;
        if (!updated[data.region].latest_prediction || new Date(data.predicted_at) > new Date(updated[data.region].latest_prediction.predicted_at)) {
          updated[data.region].latest_prediction = data;
        }
        return { ...prev, region_summary: updated };
      });
    });
    socket.on('connect_error', (err) => console.error('SocketIO connection error:', err));

    return () => socket.disconnect();
  }, []);

  const loadSystemStatus = async () => {
    setLoading((prev) => ({ ...prev, status: true }));
    try {
      const response = await fetch('http://localhost:8000/api/system-status');
      if (!response.ok) throw new Error('Failed to load system status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      toast.error('Error loading system status');
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, status: false }));
    }
  };

  const loadMetrics = async () => {
    setLoading((prev) => ({ ...prev, metrics: true }));
    try {
      const response = await fetch('http://localhost:8000/api/monitoring/metrics');
      if (!response.ok) throw new Error('Failed to load metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast.error('Error loading metrics');
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, metrics: false }));
    }
  };

  const loadReports = async () => {
    setLoading((prev) => ({ ...prev, reports: true }));
    try {
      const response = await fetch('http://localhost:8000/api/monitoring/reports');
      if (!response.ok) throw new Error('Failed to load reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      toast.error('Error loading reports');
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const loadExternalSources = async () => {
    setLoading((prev) => ({ ...prev, sources: true }));
    try {
      const response = await fetch('http://localhost:8000/api/monitoring/external-sources');
      if (!response.ok) throw new Error('Failed to load external sources');
      const data = await response.json();
      setExternalSources(data.sources);
    } catch (error) {
      toast.error('Error loading external sources');
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, sources: false }));
    }
  };

  const loadAlerts = async () => {
    setLoading((prev) => ({ ...prev, alerts: true }));
    try {
      const response = await fetch('http://localhost:8000/api/alerts');
      if (!response.ok) throw new Error('Failed to load alerts');
      const { data } = await response.json();
      setAlerts(data || []);
    } catch (error) {
      console.warn('Alerts endpoint not available, skipping:', error);
      setAlerts([]); // Fallback to empty array
    } finally {
      setLoading((prev) => ({ ...prev, alerts: false }));
    }
  };

  const loadModelStats = async () => {
    setLoading((prev) => ({ ...prev, model: true }));
    try {
      const response = await fetch('http://localhost:8000/api/flood-model/stats');
      if (!response.ok) throw new Error('Failed to load model stats');
      const data = await response.json();
      setModelStats(data);
    } catch (error) {
      toast.error('Error loading model stats');
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, model: false }));
    }
  };

  const handleRetrain = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/monitoring/retrain-model', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to retrain model');
      toast.success('Model retrained successfully');
      loadReports();
      loadModelStats(); // Refresh model stats after retrain
    } catch (error) {
      toast.error('Error retraining model');
      console.error(error);
    }
  };

  const getColor = (value, thresholdHigh, thresholdLow) => {
    if (value > thresholdHigh) return '#f44336';
    if (value > thresholdLow) return '#ff9800';
    return '#4caf50';
  };

  const statusChartData = systemStatus
    ? {
        labels: ['CPU %', 'Memory %'],
        datasets: [
          {
            label: 'Usage',
            data: [systemStatus.cpu_percent, systemStatus.memory_percent],
            backgroundColor: [
              getColor(systemStatus.cpu_percent, 90, 70),
              getColor(systemStatus.memory_percent, 90, 70),
            ],
          },
        ],
      }
    : null;

  const metricsChartData = metrics
    ? {
        labels: ['Satellites', 'Weather Stations', 'Data Points/min'],
        datasets: [
          {
            data: [metrics.satellites_active, metrics.weather_stations, metrics.datapoints_per_min / 1000],
            backgroundColor: ['#4caf50', '#ff9800', '#00C4B4'],
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, color: '#FFFFFF' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#FFFFFF' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#FFFFFF' }, grid: { display: false } },
    },
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <span>🔍</span>
            <span>Monitoring Agent</span>
          </div>
          <a href="/" className={styles.navLink}>
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>AI-Powered System Monitoring</h2>
        <p className={styles.heroText}>
          Monitor system health, data sources, alerts, and predictions in real-time for reliable flood disaster management.
        </p>
      </section>

      {/* System Status */}
      {loading.status ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading system status...
        </div>
      ) : (
        systemStatus && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>System Status</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statsItem}>
                <strong>Uptime:</strong> {Math.floor(systemStatus.uptime_seconds / 3600)} hours
              </div>
              <div className={styles.statsItem}>
                <strong>CPU:</strong> {systemStatus.cpu_percent}%
              </div>
              <div className={styles.statsItem}>
                <strong>Memory:</strong> {systemStatus.memory_percent}% ({systemStatus.memory_used_gb}GB used)
              </div>
              <div className={styles.statsItem}>
                <strong>Hostname:</strong> {systemStatus.hostname}
              </div>
            </div>
            <div className={styles.chart}>
              <Bar
                data={statusChartData}
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Resource Usage' } } }}
              />
            </div>
          </section>
        )
      )}

      {/* Metrics */}
      {loading.metrics ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading metrics...
        </div>
      ) : (
        metrics && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Environmental Metrics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statsItem}>
                <strong>Satellites Active:</strong> {metrics.satellites_active}
              </div>
              <div className={styles.statsItem}>
                <strong>Weather Stations:</strong> {metrics.weather_stations}
              </div>
              <div className={styles.statsItem}>
                <strong>Data Points/min:</strong> {metrics.datapoints_per_min}
              </div>
            </div>
            <div className={styles.chart}>
              <Doughnut
                data={metricsChartData}
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Data Sources' } } }}
              />
            </div>
          </section>
        )
      )}

      {/* External Sources */}
      {loading.sources ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading external sources...
        </div>
      ) : (
        externalSources && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>External Data Sources</h3>
            <div className={styles.historyContainer}>
              {externalSources.map((source, index) => (
                <div
                  key={index}
                  className={styles.historyItem}
                  style={{
                    backgroundColor:
                      source.status === 'operational' ? '#4caf50' : source.status === 'degraded' ? '#ff9800' : '#f44336',
                  }}
                >
                  <div className={styles.historyHeader}>
                    <span>
                      {source.name} - {source.status}
                    </span>
                  </div>
                  <div className={styles.historyDetails}>Latency: {source.latency_ms}ms</div>
                </div>
              ))}
            </div>
          </section>
        )
      )}

      {/* Reports */}
      {loading.reports ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading reports...
        </div>
      ) : (
        reports && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Monitoring Reports</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statsItem}>
                <strong>Active Alerts:</strong> {reports.active_alerts}
              </div>
            </div>
            <h4 className={styles.sectionSubtitle}>High Risk Predictions by Region</h4>
            <div className={styles.paramsGrid}>
              {Object.entries(reports.high_risk_predictions).map(([region, count]) => (
                <div key={region} className={styles.paramItem}>
                  <label className={styles.paramLabel}>{region}</label>
                  <div className={styles.paramValue}>{count}</div>
                </div>
              ))}
            </div>
            <h4 className={styles.sectionSubtitle}>Latest Flood Predictions</h4>
            <div className={styles.historyContainer}>
              {reports.flood_predictions && reports.flood_predictions.length > 0 ? (
                reports.flood_predictions.map((pred) => (
                  <div
                    key={pred.id}
                    className={`${styles.historyItem} ${styles[`${pred.risk_level}Risk`]}`}
                  >
                    <div className={styles.historyHeader}>
                      <span>
                        {pred.region} - {pred.risk_level.toUpperCase()} Risk
                      </span>
                      <span className={styles.historyDetails}>
                        {new Date(pred.predicted_at).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.historyDetails}>
                      Probability: {(pred.probability * 100).toFixed(1)}% | Water Level: {pred.estimated_water_level}m | River Level: {pred.current_river_level}m
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.historyItem}>No recent flood predictions available</div>
              )}
            </div>
          </section>
        )
      )}

      {/* Alerts */}
      {loading.alerts ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading alerts...
        </div>
      ) : (
        alerts.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Active Alerts</h3>
            <div className={styles.historyContainer}>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={styles.historyItem}
                  style={{
                    backgroundColor:
                      alert.type === 'error' ? '#f44336' : alert.type === 'warning' ? '#ff9800' : '#4caf50',
                  }}
                >
                  <div className={styles.historyHeader}>
                    <span>{alert.title || alert.message}</span>
                  </div>
                  <div className={styles.historyDetails}>
                    Type: {alert.type} | Time: {new Date(alert.time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      )}

      {/* Retrain Model Button */}
      <section className={styles.section}>
        <button onClick={handleRetrain} className={styles.formButton}>
          Retrain Flood Model
        </button>
      </section>

      {/* Model Information */}
      {loading.model ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading model information...
        </div>
      ) : (
        modelStats && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Flood Model Information</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statsItem}>
                <strong>Model Type:</strong> {modelStats.model_type}
              </div>
              <div className={styles.statsItem}>
                <strong>Accuracy:</strong> {modelStats.accuracy}%
              </div>
              <div className={styles.statsItem}>
                <strong>Training Period:</strong> {modelStats.training_data_period}
              </div>
              <div className={styles.statsItem}>
                <strong>Region:</strong> {modelStats.region}
              </div>
              <div className={styles.statsItem}>
                <strong>Model Status:</strong> {modelStats.model_status}
              </div>
            </div>
            <div className={styles.statsItem}>
              <strong>Features:</strong> {modelStats.features.join(', ')}
            </div>
          </section>
        )
      )}
    </div>
  );
}