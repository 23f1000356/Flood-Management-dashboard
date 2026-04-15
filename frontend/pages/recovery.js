import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
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
        return '#ef4444'; // Red
      case 'moderate':
        return '#f59e0b'; // Amber
      case 'low':
        return '#10b981'; // Emerald
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: '#090B0F', color: '#FFF', minHeight: '100vh', padding: '0 40px 40px' }}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#10B981', borderRadius: '6px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', padding: '6px' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: '#000', borderRadius: '1px' }}></div>)}
          </div>
          <span style={{ color: '#10B981', fontWeight: '800', letterSpacing: '1px', fontSize: '18px' }}>Luminescent Sentinel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px 20px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#94A3B8' }}>Admin Profile</span>
          <img src="https://ui-avatars.com/api/?name=Admin&background=10B981&color=fff&bold=true" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1' }}>Recovery<br/>Management</h1>
        <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '500px', marginBottom: '40px' }}>Track and manage post-disaster recovery efforts across global operational zones with real-time analytics.</p>
        
        <button className={styles.refreshBtn} style={{ background: '#10B981', color: '#000', padding: '15px 35px', borderRadius: '40px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '50px' }}>
          <span>+</span> Add Recovery Task
        </button>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '50px' }}>
          {[
            { label: 'TOTAL ACTIVE RECOVERIES', value: '1,284', trend: '+12%', icon: '📈' },
            { label: 'COMPLETED TASKS', value: '8,492', sub: 'Live', icon: '✅' },
            { label: 'PENDING APPROVALS', value: '43', sub: 'Priority', icon: '⏳' },
            { label: 'FUNDS DISTRIBUTED', value: '$2.4M', sub: 'Total', icon: '💰' }
          ].map((m, i) => (
            <div key={i} className={styles.card} style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '15px' }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900' }}>{m.value}</span>
                  <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 'bold' }}>{m.trend || m.sub}</span>
                </div>
              </div>
              <div style={{ fontSize: '32px', opacity: 0.2 }}>{m.icon}</div>
            </div>
          ))}
        </div>

        {/* Active Tasks Table Section */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900' }}>Active Recovery Tasks</h2>
            <div style={{ display: 'flex', gap: '20px', opacity: 0.5 }}>
              <span>🔍</span>
              <span>🎚️</span>
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', borderRadius: '24px', padding: '0' }}>
            <div style={{ padding: '25px 35px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px' }}>
              <span>REGION</span>
              <span>TYPE</span>
              <span style={{ textAlign: 'right' }}>TEAM</span>
            </div>
            <div style={{ padding: '0 35px' }}>
              {[
                { region: 'Coastal Sector 7', sub: 'EMERGENCY RESPONSE', type: 'Infrastructure', teamColor: '#10B981' },
                { region: 'North Highland', sub: 'AGRICULTURAL SUPPORT', type: 'Crops', teamColor: '#3B82F6' },
                { region: 'Metro Zone A', sub: 'URBAN REBUILD', type: 'Property', teamColor: '#A855F7' }
              ].map((t, i) => (
                <div key={i} style={{ padding: '30px 0', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.03)', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{t.region}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800' }}>{t.sub}</div>
                  </div>
                  <div style={{ color: '#10B981', fontWeight: '600' }}>{t.type}</div>
                  <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Damage Assessment Overview */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '30px' }}>Damage Assessment Overview</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              { icon: '🏠', label: 'Property Damage', count: '3,240', progress: 82, status: '82% Severe', color: '#10B981' },
              { icon: '🌾', label: 'Crop Damage', count: '1,120', progress: 45, status: '45% Moderate', color: '#3B82F6' },
              { icon: '🏗️', label: 'Infrastructure', count: '842', progress: 68, status: '68% Critical', color: '#A855F7' }
            ].map((d, i) => (
              <div key={i} className={styles.card} style={{ padding: '30px', backgroundColor: 'rgba(21, 26, 35, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', background: 'rgba(255,255,255,0.03)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700' }}>{d.label}</div>
                      <div style={{ fontSize: '14px', color: '#94A3B8' }}>{d.count} Reports logged</div>
                    </div>
                  </div>
                  <div style={{ color: d.color, fontSize: '14px', fontWeight: '800' }}>{d.status}</div>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ width: `${d.progress}%`, height: '100%', background: d.color, borderRadius: '10px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fund Allocation */}
        <div className={styles.card} style={{ padding: '40px', backgroundColor: 'rgba(21, 26, 35, 0.4)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '40px', textAlign: 'left' }}>Fund Allocation</h3>
          <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto 40px' }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="65, 100" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: '900' }}>65%</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', letterSpacing: '1px' }}>ALLOCATED</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '20px', textAlign: 'left' }}>
            {[
              { label: 'USED FUNDS', value: '$1.56M', color: '#10B981', progress: 65 },
              { label: 'RESERVED', value: '$0.84M', color: '#3B82F6', progress: 35 }
            ].map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8' }}>{f.label}</span>
                  <span>{f.value}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ width: `${f.progress}%`, height: '100%', background: f.color, borderRadius: '10px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Breakdown */}
        <div className={styles.card} style={{ padding: '40px', backgroundColor: 'rgba(21, 26, 35, 0.4)', marginTop: '40px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', letterSpacing: '2px', marginBottom: '30px' }}>REGIONAL BREAKDOWN</h3>
          <div style={{ display: 'grid', gap: '30px' }}>
            {[
              { id: 'C7', area: 'Coastal Sector 7', progress: 78 },
              { id: 'NH', area: 'North Highland', progress: 42 },
              { id: 'MZ', area: 'Metro Zone A', progress: 91 }
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: '#10B981' }}>{r.id}</span>
                <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{r.area}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{r.progress}%</span>
                   </div>
                   <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                      <div style={{ width: `${r.progress}%`, height: '100%', background: '#10B981', borderRadius: '10px', opacity: 0.8 }}></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
          <button className={styles.refreshBtn} style={{ width: '100%', marginTop: '40px', padding: '20px', borderRadius: '40px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFF', fontWeight: '800', border: '1px solid rgba(255,255,255,0.05)', letterSpacing: '2px' }}>GENERATE REPORT</button>
        </div>
      </div>

      {/* Internal Navigation (Floating) */}
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(21, 26, 35, 0.8)', backdropFilter: 'blur(20px)', padding: '10px', borderRadius: '50px', display: 'flex', gap: '10px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000 }}>
        {[
          { icon: '⚒️', label: 'RECOVERY', active: true },
          { icon: '👥', label: 'VOLUNTEERS', active: false },
          { icon: '📦', label: 'RESOURCES', active: false },
          { icon: '⚙️', label: 'SETTINGS', active: false }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '40px', backgroundColor: item.active ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: item.active ? '#10B981' : '#94A3B8', cursor: 'pointer' }}>
            <span>{item.icon}</span>
            {item.active && <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>{item.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}