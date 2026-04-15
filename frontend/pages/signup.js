"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './signup.module.css';
import API_URL from '../utils/config';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const router = useRouter();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, phone, email, password, gender }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await response.json();
      setSuccess(data.message || 'Account created successfully!');
      setShowPopup(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  const fields = [
    { id: 'name', label: 'Full Name', type: 'text', value: name, setter: setName, placeholder: 'Enter your full name', icon: '👤' },
    { id: 'username', label: 'Username', type: 'text', value: username, setter: setUsername, placeholder: 'Choose a username', icon: '🆔' },
    { id: 'phone', label: 'Phone Number', type: 'tel', value: phone, setter: setPhone, placeholder: 'Enter your phone number', icon: '📱' },
    { id: 'email', label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'Enter your email', icon: '✉️' },
    { id: 'password', label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: 'Create a password', icon: '🔒' }
  ];

  return (
    <div className={styles.container}>
      {/* Left Hero Panel */}
      <motion.div 
        className={styles.heroPanel}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot}></span>
          Join the Global Network
        </div>
        <h1 className={styles.heroTitle}>
          Create Your<br/>
          <span className={styles.heroTitleAccent}>ACMS Account</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Join the Autonomous Climate Mitigation System network and get access to real-time disaster monitoring, AI predictions, and community response tools.
        </p>
        <div className={styles.heroFeatures}>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>🛰️</div>
            <span>Real-time satellite monitoring & alerts</span>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>🧠</div>
            <span>AI-powered disaster prediction engine</span>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>🤝</div>
            <span>Community-driven response coordination</span>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>📊</div>
            <span>Personal impact dashboard & analytics</span>
          </div>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div className={styles.formPanel}>
        <motion.div 
          className={styles.formContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className={styles.title}>Personnel Enrollment</h2>
          <p className={styles.subtitle}>Initialize your system clearance for the Global Mitigation Network</p>

          {error && (
            <motion.div className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ⚠️ {error}
            </motion.div>
          )}

          {success && !showPopup && (
            <motion.div className={styles.success} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ {success}
            </motion.div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            {fields.map((field) => (
              <motion.div 
                key={field.id} 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label htmlFor={field.id} className={styles.label}>{field.label}</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>{field.icon}</span>
                  <input
                    type={field.type}
                    id={field.id}
                    className={styles.input}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    required
                  />
                </div>
              </motion.div>
            ))}

            <div className={styles.inputGroup}>
              <label htmlFor="gender" className={styles.label}>Gender</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>⚧</span>
                <select
                  id="gender"
                  className={styles.select}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Account
            </motion.button>
          </form>

          <AnimatePresence>
            {showPopup && (
              <motion.div 
                className={styles.popup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className={styles.popupContent}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <h2 style={{ color: "#10b981", marginBottom: "15px" }}>✅ Success</h2>
                  <p style={{ color: "#94A3B8", marginBottom: "20px" }}>Account created successfully!</p>
                  <motion.button
                    onClick={() => {
                      setShowPopup(false);
                      router.push('/login?message=' + encodeURIComponent('Account created successfully!'));
                    }}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue to Login
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className={styles.loginLink}>
            Already have an account? <Link href="/login" className={styles.link}>Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;