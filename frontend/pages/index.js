import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './index.module.css';

const AutonomousClimateSystem = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState('');
  const parallaxRef = useRef(null);
  const sliderIntervalRef = useRef(null);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop",
      title: "Real-time Climate Monitoring",
      description: "Advanced satellite imaging and sensor networks"
    },
    {
      image: "https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=1200&h=600&fit=crop",
      title: "AI Weather Prediction",
      description: "LSTM neural networks for accurate forecasting"
    },
    {
      image: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1debc?w=1200&h=600&fit=crop",
      title: "Disaster Response",
      description: "Automated resource allocation and evacuation planning"
    },
    {
      image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e5?w=1200&h=600&fit=crop",
      title: "Recovery Support",
      description: "AI-powered recovery planning and resource optimization"
    }
  ];

  const features = [
    {
      icon: "🧠",
      title: "Disaster Prediction Agent",
      description: "LSTM Neural Network for time-series weather pattern analysis with multi-feature input processing 15 weather parameters.",
      details: ["Real-time risk assessment", "Confidence scores", "Continuous learning"]
    },
    {
      icon: "🛰️",
      title: "Monitoring Agent", 
      description: "CNN-based satellite image analysis for fire/flood detection with social media monitoring using advanced NLP.",
      details: ["Satellite imagery", "Social media tracking", "Multi-source fusion"]
    },
    {
      icon: "⚙️",
      title: "Resource Allocation Agent",
      description: "Reinforcement Learning (Q-learning) for optimal resource deployment with dynamic management capabilities.",
      details: ["Q-learning optimization", "Dynamic management", "Distance-based routing"]
    },
    {
      icon: "🗺️",
      title: "Evacuation Planning Agent",
      description: "Dijkstra's algorithm for optimal route planning with multi-phase evacuation and capacity management systems.",
      details: ["Optimal routing", "Safe zone identification", "Traffic-aware updates"]
    },
    {
      icon: "🔧",
      title: "Recovery Support Agent",
      description: "AI-powered recovery planning with phase-based approach, cost estimation, and stakeholder communication.",
      details: ["Recovery planning", "Cost estimation", "Timeline optimization"]
    },
    {
      icon: "📊",
      title: "Simulation Agent",
      description: "Synthetic scenario generation for training and testing with GAN-like disaster progression modeling capabilities.",
      details: ["Scenario generation", "GAN modeling", "Training simulations"]
    }
  ];

  // Array of background image URLs (non-orange themes)
  const backgroundImages = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=600&fit=crop", // Mountain landscape
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=600&fit=crop", // Forest
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop", // Ocean
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=600&fit=crop", // Snowy landscape
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=600&fit=crop"  // Cloudy sky
  ];

  // Parallax effect and random background image on mount
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    // Set random background image on page load
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBackgroundImage(randomImage);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto slider
  useEffect(() => {
    const startSlider = () => {
      sliderIntervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 5000);
    };

    startSlider();

    return () => {
      if (sliderIntervalRef.current) {
        clearInterval(sliderIntervalRef.current);
      }
    };
  }, [slides.length]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    if (sliderIntervalRef.current) {
      clearInterval(sliderIntervalRef.current);
    }
    // Restart auto slider
    sliderIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo}>
            <span className={styles.logoIcon}>🌱</span>
            <span>ACMS</span>
          </div>
          <ul className={`${styles.navMenu} ${isMenuOpen ? styles.active : ''}`}>
            
            <li className={styles.navItem}>
              <a href="#weather" className={styles.navLink} onClick={() => scrollToSection('weather')}>Weather</a>
            </li>
            <li className={styles.navItem}>
              <a href="#footprint" className={styles.navLink} onClick={() => scrollToSection('footprint')}>Footprint Calculator</a>
            </li>
            <li className={styles.navItem}>
              <a href="#features" className={styles.navLink} onClick={() => scrollToSection('features')}>Features</a>
            </li>
            <li className={styles.navItem}>
              <Link href="/login" className={`${styles.navLink} ${styles.loginBtn}`}>Login</Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/signup" className={`${styles.navLink} ${styles.loginBtn}`}>Sign Up</Link>
            </li>
          </ul>
          <div className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`} onClick={toggleMenu}>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section className={styles.hero} id="home">
        <div 
          className={styles.parallaxBg}
          ref={parallaxRef}
          style={{ 
            transform: `translate3d(0, ${scrollY * -0.5}px, 0)`,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Autonomous Climate Mitigation System</h1>
          <p className={styles.heroSubtitle}>
            Advanced AI-powered solutions for climate monitoring, disaster prediction, and environmental protection
          </p>
          <div className={styles.heroButtons}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => scrollToSection('features')}>Explore System</button>
            <button className={`${styles.btn} ${styles.btnSecondary}`}>Learn More</button>
          </div>
        </div>
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollArrow}></div>
        </div>
      </section>

      {/* Image Slider */}
      <section className={styles.imageSlider}>
        <div className={styles.sliderContainer}>
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            >
              <img src={slide.image} alt={slide.title} />
              <div className={styles.slideContent}>
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.sliderNav}>
          {slides.map((_, index) => (
            <button 
              key={index}
              className={`${styles.navDot} ${index === currentSlide ? styles.active : ''}`}
              onClick={() => handleSlideChange(index)}
            ></button>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>🔥 Complete ACMS Features</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <span>{feature.icon}</span>
                </div>
                <div className={styles.featureContent}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <div className={styles.featureDetails}>
                    {feature.details.map((detail, idx) => (
                      <span key={idx}>{detail}</span>
                    ))}
                  </div>
                  <div className={styles.featureArrow}>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Effect Section */}
      <section className={styles.waveSection}>
        <div className={styles.waveContainer}>
          <div className={`${styles.wave} ${styles.wave1}`}></div>
          <div className={`${styles.wave} ${styles.wave2}`}></div>
          <div className={`${styles.wave} ${styles.wave3}`}></div>
        </div>
        <div className={styles.waveContent}>
          <h2>Join the Climate Revolution</h2>
          <p>Be part of the solution with our advanced autonomous climate mitigation system</p>
          <button className={`${styles.btn} ${styles.btnWave}`}>Get Started</button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerSection}>
            <h3>Autonomous Climate Mitigation System</h3>
            <p>ACMS explores the unknown in climate science, innovates for the benefit of humanity, and inspires the world through discovery.</p>
            <div className={styles.footerMission}>
              <a href="#">About ACMS's Mission</a>
            </div>
            <div className={styles.footerJoin}>
              <a href="#" className={styles.joinBtn}>
                <span>Join Us</span>
                <span className={styles.joinArrow}>→</span>
              </a>
            </div>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Home</h4>
              <ul>
                <li><a href="#">Climate Monitoring</a></li>
                <li><a href="#">Weather Prediction</a></li>
                <li><a href="#">Disaster Response</a></li>
                <li><a href="#">ACMS+ <span className={styles.liveBadge}>LIVE</span></a></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h4>Climate Solutions</h4>
              <ul>
                <li><a href="#">Earth Monitoring</a></li>
                <li><a href="#">Climate Systems</a></li>
                <li><a href="#">Environmental Data</a></li>
                <li><a href="#">Science Research</a></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h4>Technology</h4>
              <ul>
                <li><a href="#">AI & Machine Learning</a></li>
                <li><a href="#">Satellite Technology</a></li>
                <li><a href="#">Data Analytics</a></li>
                <li><a href="#">Learning Resources</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerSocial}>
            <h4>Follow ACMS</h4>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialIcon}>📘</a>
              <a href="#" className={styles.socialIcon}>📷</a>
              <a href="#" className={styles.socialIcon}>🐦</a>
              <a href="#" className={styles.socialIcon}>📺</a>
            </div>
            <div className={styles.footerExtra}>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.container}>
            <p>&copy; 2025 Autonomous Climate Mitigation System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AutonomousClimateSystem;