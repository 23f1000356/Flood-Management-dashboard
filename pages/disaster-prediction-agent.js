import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './disaster-prediction-agent.module.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DisasterPredictionAgent() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState({
    predict: false,
    stats: false,
    history: false,
  });
  const [formData, setFormData] = useState({
    mar_may_rainfall: 350,
    june_10days_rainfall: 250,
    may_june_increase: 400,
    region: 'Kerala',
  });
  const [history, setHistory] = useState([]);
  const [modelStats, setModelStats] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadModelStats();
    loadPredictionHistory();
  }, []);

  const loadModelStats = async () => {
    setLoading((prev) => ({ ...prev, stats: true }));
    try {
      const response = await fetch('http://localhost:8000/api/flood-model/stats');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const stats = await response.json();
      setModelStats({
        ...stats,
        features: Array.isArray(stats.features) ? stats.features : [],
      });
    } catch (error) {
      toast.error('Error loading model stats: ' + error.message);
      setModelStats({
        model_type: 'N/A',
        accuracy: 0,
        training_data_period: 'N/A',
        region: 'N/A',
        features: [],
      });
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  const loadPredictionHistory = async () => {
    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const response = await fetch(`http://localhost:8000/api/flood-predictions/history?limit=${itemsPerPage}&offset=${(historyPage - 1) * itemsPerPage}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const { data } = await response.json();
      setHistory(data);
    } catch (error) {
      toast.error('Error loading prediction history: ' + error.message);
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  const handlePredict = async () => {
    if (
      formData.mar_may_rainfall < 0 || formData.mar_may_rainfall > 1000 ||
      formData.june_10days_rainfall < 0 || formData.june_10days_rainfall > 500 ||
      formData.may_june_increase < 0 || formData.may_june_increase > 1000
    ) {
      toast.error('Please enter valid rainfall values: March-May (0-1000mm), June 10-day (0-500mm), May-June Increase (0-1000mm)');
      return;
    }

    setLoading((prev) => ({ ...prev, predict: true }));
    try {
      const response = await fetch('http://localhost:8000/api/predict-flood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();
      setPrediction(result);
      loadPredictionHistory();
      toast.success('Prediction completed successfully');
    } catch (error) {
      toast.error('Error making prediction: ' + error.message);
    } finally {
      setLoading((prev) => ({ ...prev, predict: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'region' ? value : parseFloat(value) || 0,
    }));
  };

  const getRiskColor = (level) => {
    switch (level) {
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

  const getWaterColor = (level) => {
    if (level > 2) return '#f44336';
    if (level > 1) return '#ff9800';
    return '#4caf50';
  };

  const chartData = prediction
    ? {
        labels: ['Flood Probability', 'Model Confidence'],
        datasets: [
          {
            label: 'Prediction Metrics',
            data: [prediction.probability * 100, prediction.confidence * 100],
            backgroundColor: [getRiskColor(prediction.risk_level), '#00C4B4'],
            borderColor: [getRiskColor(prediction.risk_level), '#00C4B4'],
            borderWidth: 1,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Flood Prediction Metrics', color: '#FFFFFF' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Percentage (%)', color: '#FFFFFF' },
        ticks: { color: '#FFFFFF' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      x: {
        ticks: { color: '#FFFFFF' },
        grid: { display: false },
      },
    },
  };

  const regions = [
    'Kerala',
    'Assam',
    'Bihar',
    'Uttar Pradesh',
    'West Bengal',
    'Odisha'
  ];

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <span>💧</span>
            <span>Disaster Prediction Agent</span>
          </div>
          <a href="/" className={styles.navLink}>
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>AI-Powered Flood Prediction System</h2>
        <p className={styles.heroText}>
          Predict flood likelihood using rainfall patterns based on historical data (1901-2015). Enhanced with water level estimates and other parameters.
        </p>
      </section>

      {loading.stats ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading model stats...
        </div>
      ) : (
        modelStats && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Model Information</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statsItem}>
                <strong>Model Type:</strong> {modelStats.model_type}
              </div>
              <div className={styles.statsItem}>
                <strong>Accuracy:</strong> {(modelStats.accuracy * 100).toFixed(1)}%
              </div>
              <div className={styles.statsItem}>
                <strong>Training Period:</strong> {modelStats.training_data_period}
              </div>
              <div className={styles.statsItem}>
                <strong>Region:</strong> {modelStats.region}
              </div>
            </div>
            <div className={styles.statsItem}>
              <strong>Features:</strong>{' '}
              {modelStats.features && Array.isArray(modelStats.features)
                ? modelStats.features.join(', ')
                : 'N/A'}
            </div>
          </section>
        )
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Rainfall Input Parameters</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>March-May Rainfall (mm):</label>
            <input
              type="number"
              name="mar_may_rainfall"
              value={formData.mar_may_rainfall}
              onChange={handleInputChange}
              className={styles.formInput}
              min="0"
              max="1000"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>June 10-day Average (mm):</label>
            <input
              type="number"
              name="june_10days_rainfall"
              value={formData.june_10days_rainfall}
              onChange={handleInputChange}
              className={styles.formInput}
              min="0"
              max="500"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>May-June Increase (mm):</label>
            <input
              type="number"
              name="may_june_increase"
              value={formData.may_june_increase}
              onChange={handleInputChange}
              className={styles.formInput}
              min="0"
              max="1000"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Region:</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              className={styles.formSelect}
              style={{ color: 'black' }}
            >
              {regions.map((region) => (
                <option key={region} value={region} style={{ color: 'black' }}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handlePredict}
          disabled={loading.predict}
          className={styles.formButton}
        >
          {loading.predict ? (
            <>
              <span className={styles.loadingSpinner}></span>Predicting...
            </>
          ) : (
            'Predict Flood Risk'
          )}
        </button>
      </section>

      {prediction && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Prediction Results</h3>
          <div className={styles.resultsGrid}>
            <div style={{ textAlign: 'center' }}>
              <div
                className={`${styles.resultsIcon} ${styles[`${prediction.risk_level}Risk`]}`}
              >
                {prediction.prediction === 1 ? '⚠️' : '✅'}
              </div>
              <div className={styles.resultsText}>{prediction.interpretation}</div>
              <div className={styles.resultsRisk}>
                Risk Level:{' '}
                <span className={styles[`${prediction.risk_level}Risk`]}>
                  {prediction.risk_level.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              {chartData && (
                <div className={styles.chart}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
          <div className={styles.resultsGrid}>
            <div className={styles.resultsMetric}>
              <div className={styles.resultsMetricValue}>
                {(prediction.probability * 100).toFixed(1)}%
              </div>
              <div className={styles.resultsMetricLabel}>Flood Probability</div>
            </div>
            <div className={styles.resultsMetric}>
              <div className={styles.resultsMetricValue}>
                {(prediction.confidence * 100).toFixed(1)}%
              </div>
              <div className={styles.resultsMetricLabel}>Model Confidence</div>
            </div>
          </div>
          <h4 className={styles.sectionSubtitle}>Additional Flood Parameters</h4>
          <div className={styles.paramsGrid}>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>Estimated Water Level (m)</label>
              <div className={styles.paramValue} style={{ color: getWaterColor(prediction.estimated_water_level) }}>
                {prediction.estimated_water_level}
              </div>
              <div className={styles.waterGauge}>
                <div 
                  className={styles.waterGaugeFill} 
                  style={{ 
                    width: `${Math.min(prediction.estimated_water_level / 3 * 100, 100)}%`,
                    backgroundColor: getWaterColor(prediction.estimated_water_level)
                  }} 
                />
              </div>
            </div>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>Current River Level (m)</label>
              <div className={styles.paramValue} style={{ color: getWaterColor(prediction.current_river_level - 5) }}>
                {prediction.current_river_level}
              </div>
              <div className={styles.waterGauge}>
                <div 
                  className={styles.waterGaugeFill} 
                  style={{ 
                    width: `${Math.min((prediction.current_river_level - 5) / 2 * 100, 100)}%`,
                    backgroundColor: getWaterColor(prediction.current_river_level - 5)
                  }} 
                />
              </div>
            </div>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>Evacuation Recommended</label>
              <div className={styles.paramValue} style={{ color: prediction.evacuation_recommendation === 'Yes' ? '#f44336' : '#4caf50' }}>
                {prediction.evacuation_recommendation}
              </div>
            </div>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>Estimated Affected Population</label>
              <div className={styles.paramValue}>
                {prediction.affected_population_estimate.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      )}

      {loading.history ? (
        <div className={styles.section}>
          <span className={styles.loadingSpinner}></span>Loading prediction history...
        </div>
      ) : (
        history.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Recent Predictions</h3>
            <div className={styles.historyContainer}>
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.historyItem} ${styles[`${item.flood_probability > 0.7 ? 'high' : item.flood_probability > 0.3 ? 'moderate' : 'low'}Risk`]}`}
                >
                  <div className={styles.historyHeader}>
                    <span>
                      {item.region} - {item.flood_prediction === 1 ? 'Flood Expected' : 'No Flood'}
                    </span>
                    <span className={styles.historyDetails}>
                      {new Date(item.predicted_at).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.historyDetails}>
                    Probability: {(item.flood_probability * 100).toFixed(1)}% | Confidence:{' '}
                    {(item.confidence * 100).toFixed(1)}%
                  </div>
                  <div className={styles.historyDetails}>
                    Water Level: {item.estimated_water_level}m | River Level: {item.current_river_level}m
                  </div>
                </div>
              ))}
            </div>
            {history.length >= historyPage * itemsPerPage && (
              <button
                onClick={() => setHistoryPage((prev) => prev + 1)}
                className={styles.formButton}
                style={{ width: '150px', marginTop: '1rem' }}
              >
                Load More
              </button>
            )}
          </section>
        )
      )}
    </div>
  );
}