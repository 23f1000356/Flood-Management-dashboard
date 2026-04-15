"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./login.module.css";
import API_URL from "../utils/config";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setFlashMessage(message);
      const timer = setTimeout(() => setFlashMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFlashMessage("");
    setShowErrorPopup(false);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      setShowErrorPopup(true);
      return;
    }

    try {
      const loginData = { username, password, role };
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user_id || Math.floor(Math.random() * 1000),
          username: data.username,
          role: data.role,
        })
      );

      if (data.redirect === "/admin") {
        router.push("/admin");
      } else {
        router.push("/UserDashboard");
      }
      setFlashMessage("Login successful!");
    } catch (err) {
      setError(err.message || "Invalid username or password. Please try again.");
      setShowErrorPopup(true);
    }
  };

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
          Enterprise-Grade Security
        </div>
        <h1 className={styles.heroTitle}>
          AI Disaster<br/>Management<br/>
          <span className={styles.heroTitleAccent}>System</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Predict. Prevent. Protect.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <div className={styles.heroStatIcon}>⚡</div>
            <div className={styles.heroStatValue}>99.9%</div>
            <div className={styles.heroStatLabel}>Real-time AI</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatIcon}>🛡️</div>
            <div className={styles.heroStatValue}>24/7</div>
            <div className={styles.heroStatLabel}>Uptime</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatIcon}>🌐</div>
            <div className={styles.heroStatValue}>Live</div>
            <div className={styles.heroStatLabel}>Monitoring</div>
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
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSubtitle}>Sign in to access your dashboard</p>

          {flashMessage && (
            <motion.div className={styles.success} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ {flashMessage}
            </motion.div>
          )}

          {error && !showErrorPopup && (
            <motion.div className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ⚠️ {error}
            </motion.div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✉️</span>
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
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
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
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="role" className={styles.label}>Role</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <select
                  id="role"
                  className={styles.select}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <motion.button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
          </form>

          <p className={styles.signupLink}>
            Don't have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
          </p>

          <div className={styles.footerSecurity}>
            <span className={styles.footerItem}>🛡️ Secure Login</span>
            <span className={styles.footerItem}>⚡ 256-bit Encryption</span>
            <span className={styles.footerItem}>✅ ISO Certified</span>
          </div>
        </motion.div>
      </div>

      {/* Error Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div 
            className={styles.popup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.popupContent}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <h2 style={{ color: "#ef4444", marginBottom: "15px" }}>Error</h2>
              <p style={{ marginBottom: "20px", color: "#94A3B8" }}>{error}</p>
              <motion.button
                onClick={() => setShowErrorPopup(false)}
                className={`${styles.btn} ${styles.btnPrimary}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;