"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './signup.module.css';
import navStyles from './index.module.css';
import { useRouter } from 'next/navigation';

/**
 * Signup component for user registration
 */
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    let responseStatus = null;
    try {
      const response = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, phone, email, password, gender }),
      });
      responseStatus = response.status;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await response.json();
      setSuccess(data.message || 'Account created successfully!');
      setShowPopup(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Signup error:', err, 'Response status:', responseStatus);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    router.push('/login?message=' + encodeURIComponent('Account created successfully!'));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
      <nav className={navStyles.navbar}>
        <div className={navStyles.navContainer}>
          <div className={navStyles.navLogo}>
            <span className={navStyles.logoIcon}>🌱</span>
            <span>ACMS</span>
          </div>
          <ul className={`${navStyles.navMenu} ${isMenuOpen ? navStyles.active : ''}`}>
            <li className={navStyles.navItem}>
              <Link href="/" className={`${navStyles.navLink} ${navStyles.loginBtn}`}>Home</Link>
            </li>
           
            <li className={navStyles.navItem}>
              <Link href="/login" className={`${navStyles.navLink} ${navStyles.loginBtn}`}>Login</Link>
            </li>
           
          </ul>
          <div className={`${navStyles.hamburger} ${isMenuOpen ? navStyles.active : ''}`} onClick={toggleMenu}>
            <span className={navStyles.bar}></span>
            <span className={navStyles.bar}></span>
            <span className={navStyles.bar}></span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.parallaxBg}></div>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Sign Up for ACMS</h1>
        <p className={styles.subtitle}>Join the Autonomous Climate Mitigation System</p>
        {error && <p className={styles.error}>{error}</p>}
        {success && !showPopup && <p className={styles.success}>{success}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Full Name</label>
            <input
              type="text"
              id="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>Phone Number</label>
            <input
              type="tel"
              id="phone"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="gender" className={styles.label}>Gender</label>
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
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Sign Up
          </button>
        </form>
        {showPopup && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <h2>Success</h2>
              <p>Account created successfully!</p>
              <button onClick={handlePopupClose} className={`${styles.btn} ${styles.btnPrimary}`}>
                OK
              </button>
            </div>
          </div>
        )}
        <p className={styles.loginLink}>
          Already have an account? <Link href="/login" className={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;