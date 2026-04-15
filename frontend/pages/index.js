import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './index.module.css';

const AutonomousClimateSystem = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showcaseCards = [
    {
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      title: "Glacier Monitoring",
      desc: "Real-time tracking of melting rates and environmental impact indices."
    },
    {
      image: "/images/fire.jpg",
      title: "Wildfire Prediction",
      desc: "AI-driven algorithms predicting risk zones with 94% accuracy."
    },
    {
      image: "/images/flood-defence.jpg",
      title: "Flood Defense",
      desc: "Autonomous resource allocation system for rapid flood response."
    }
  ];

  const features = [
    {
      icon: "🧠",
      title: "Disaster Prediction Agent",
      description: "LSTM Neural Network for time-series weather pattern analysis with multi-feature input processing."
    },
    {
      icon: "🛰️",
      title: "Monitoring Agent", 
      description: "CNN-based satellite image analysis for disaster detection with social media monitoring."
    },
    {
      icon: "⚙️",
      title: "Resource Allocation Agent",
      description: "Reinforcement Learning for optimal resource deployment across affected regions."
    },
    {
      icon: "🗺️",
      title: "Relief Management",
      description: "End-to-end management of shelters, volunteers, and emergency supplies."
    }
  ];

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo}>
            <span className={styles.logoIcon}>🌲</span>
            <span>ACMS</span>
          </div>
          <ul className={styles.navMenu}>
            <li className={styles.navItem}><a href="#home" className={styles.navLink}>Home</a></li>
            <li className={styles.navItem}><a href="#features" className={styles.navLink}>Solutions</a></li>
            <li className={styles.navItem}><a href="#about" className={styles.navLink}>About</a></li>
            <li className={styles.navItem}><Link href="/login" className={styles.navLink}>Login</Link></li>
            <li className={styles.navItem}><Link href="/signup" className={`${styles.navLink} ${styles.btnPrimary}`} style={{padding: '10px 25px', color: '#000'}}>Get Started</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero} id="home">
        <div 
          className={styles.parallaxBg}
          style={{ transform: `translate3d(0, ${scrollY * 0.4}px, 0)` }}
        ></div>
        <div className={styles.heroOverlay}></div>
        
        <div className={styles.heroContent}>
          <motion.div 
            className={styles.heroGlassCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className={styles.heroTitle}
              initial={{ opacity: 0, letterSpacing: '-10px' }}
              animate={{ opacity: 1, letterSpacing: '-2px' }}
              transition={{ duration: 1 }}
            >
              <span>CLIMATE YOU</span>
              <span>CAN CHANGE.</span>
            </motion.h1>
            <p className={styles.heroSubtitle}>
              Climate change is a real issue people tend to completely overlook. 
              Our AI-driven mitigation system helps you win this battle before it's too late. 
              Join the future of environmental protection.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/signup">
                <button className={styles.btnPrimary} style={{padding: '20px 50px', borderRadius: '100px', fontWeight: '800', border: 'none', cursor: 'pointer', backgroundColor: '#10B981'}}>ACTION PLAN</button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Showcase Cards (Floating) */}
      <div className={styles.showcaseGrid}>
        {showcaseCards.map((card, i) => (
          <motion.div 
            key={i}
            className={styles.showcaseCard}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
          >
            <img src={card.image} className={styles.showcaseImg} alt={card.title} />
            <div className={styles.showcaseContent}>
              <p style={{ color: '#10B981', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>CASE STUDY 0{i+1}</p>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <span className={styles.learnMore}>LEARN MORE ↗</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Features Section */}
      <section className={styles.section} id="features">
        <div className={styles.navContainer}>
          <h2 className={styles.sectionTitle}>Precision Mitigation <span>Agents</span></h2>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <motion.div 
                key={i}
                className={styles.featureCard}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>{f.title}</h3>
                  <p style={{ color: '#94A3B8', lineHeight: '1.6' }}>{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability Section (Image/Text side by side) */}
      <section className={styles.section} style={{ background: '#090B0F' }}>
        <div className={styles.navContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '30px' }}>Building a Greener Tomorrow, Today</h2>
            <p style={{ color: '#94A3B8', fontSize: '18px', lineHeight: '1.8', marginBottom: '40px' }}>
              ACMS is built on the belief that small changes lead to powerful transformations. 
              We create accessible tools, resources, and programs that help individuals and nations 
              live sustainably. Together, we can restore the balance of our planet.
            </p>
            <button className={styles.btnPrimary} style={{padding: '18px 40px', borderRadius: '100px', fontWeight: '800', border: 'none', cursor: 'pointer', backgroundColor: '#10B981'}}>OUR MISSION</button>
          </div>
          <div style={{ position: 'relative' }}>
            <motion.img 
              src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" 
              style={{ width: '100%', borderRadius: '40px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
            />
            <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', background: '#10B981', padding: '40px', borderRadius: '30px', color: '#000', fontWeight: '900', fontSize: '24px' }}>
              85% REDUCTION<br/><span style={{ fontSize: '14px', fontWeight: '500' }}>IN RESPONSE TIME</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerColumn}>
            <div className={styles.footerLogo}>ACMS.</div>
            <p style={{ color: '#94A3B8', maxWidth: '400px', lineHeight: '1.8' }}>
              ACMS is a real-time climate monitoring and autonomous mitigation system 
              designed to protect the world's most vulnerable regions.
            </p>
          </div>
          <div className={styles.footerColumn}>
            <h4>Platform</h4>
            <ul>
              <li><Link href="/disaster-prediction-agent">Prediction</Link></li>
              <li><Link href="/monitoring-agent">Monitoring</Link></li>
              <li><Link href="/resource">Resources</Link></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <ul>
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Connect</h4>
            <ul>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '100px', padding: '30px 0', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569', fontSize: '14px' }}>
          © 2026 ACMS. All rights Reserved. Designed for the Planet.
        </div>
      </footer>
    </div>
  );
};

export default AutonomousClimateSystem;