"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createElement } from "react";
import styles from "./login.module.css";
import navStyles from "./index.module.css";
import API_URL from "../utils/config";

/**
 * Login component for user authentication
 */
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setFlashMessage(message);
      const timer = setTimeout(() => setFlashMessage(""), 3000);
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
      console.log("Sending login data:", loginData);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login error:", errorData);
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      // Store user data in localStorage to match Admin.js and UserDashboard.js expectations
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user_id || Math.floor(Math.random() * 1000),
          username: data.username,
          role: data.role,
        })
      );

      // Use the redirect field from the backend response
      if (data.redirect === "/admin") {
        router.push("/admin");
      } else {
        router.push("/UserDashboard");
      }

      // Optional: Set a success flash message
      setFlashMessage("Login successful!");
    } catch (err) {
      setError(err.message || "Invalid username or password. Please try again.");
      setShowErrorPopup(true);
      console.error("Login error:", err);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handlePopupClose = () => {
    setShowErrorPopup(false);
  };

  return createElement("div", { className: styles.container },
    // Navigation
    createElement("nav", { className: navStyles.navbar },
      createElement("div", { className: navStyles.navContainer },
        createElement("div", { className: navStyles.navLogo },
          createElement("span", { className: navStyles.logoIcon }, "🌱"),
          createElement("span", null, "ACMS")
        ),
        createElement("ul", { className: `${navStyles.navMenu} ${isMenuOpen ? navStyles.active : ""}` },
          createElement("li", { className: navStyles.navItem },
            createElement("a", { href: "/", className: `${navStyles.navLink} ${navStyles.loginBtn}` }, "Home")
          ),
          createElement("li", { className: navStyles.navItem },
            createElement("a", { href: "/signup", className: `${navStyles.navLink} ${navStyles.loginBtn}` }, "Sign Up")
          )
        ),
        createElement("div", {
          className: `${navStyles.hamburger} ${isMenuOpen ? navStyles.active : ""}`,
          onClick: toggleMenu
        },
          createElement("span", { className: navStyles.bar }),
          createElement("span", { className: navStyles.bar }),
          createElement("span", { className: navStyles.bar })
        )
      )
    ),
    // Main Content
    createElement("div", { className: styles.parallaxBg }),
    createElement("div", { className: styles.formContainer },
      createElement("h1", { className: styles.title }, "Login to ACMS"),
      createElement("p", { className: styles.subtitle }, "Access the Autonomous Climate Mitigation System"),
      flashMessage && createElement("p", { className: styles.success }, flashMessage),
      error && !showErrorPopup && createElement("p", { className: styles.error }, error),
      createElement("form", { className: styles.form, onSubmit: handleSubmit },
        createElement("div", { className: styles.inputGroup },
          createElement("label", { htmlFor: "username", className: styles.label }, "Username"),
          createElement("input", {
            type: "text",
            id: "username",
            className: styles.input,
            value: username,
            onChange: (e) => setUsername(e.target.value),
            placeholder: "Enter your username",
            required: true
          })
        ),
        createElement("div", { className: styles.inputGroup },
          createElement("label", { htmlFor: "password", className: styles.label }, "Password"),
          createElement("input", {
            type: "password",
            id: "password",
            className: styles.input,
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Enter your password",
            required: true
          })
        ),
        createElement("div", { className: styles.inputGroup },
          createElement("label", { htmlFor: "role", className: styles.label }, "Role"),
          createElement("select", {
            id: "role",
            className: styles.select,
            value: role,
            onChange: (e) => setRole(e.target.value)
          },
            createElement("option", { value: "user" }, "User"),
            createElement("option", { value: "admin" }, "Admin")
          )
        ),
        createElement("button", {
          type: "submit",
          className: `${styles.btn} ${styles.btnPrimary}`
        }, "Login")
      ),
      showErrorPopup && createElement("div", { className: styles.popup },
        createElement("div", { className: styles.popupContent },
          createElement("h2", null, "Error"),
          createElement("p", null, error),
          createElement("button", {
            onClick: handlePopupClose,
            className: `${styles.btn} ${styles.btnPrimary}`
          }, "OK")
        )
      ),
      createElement("p", { className: styles.signupLink },
        "New user? ",
        createElement("a", { href: "/signup", className: styles.link }, "Sign up")
      )
    )
  );
};

export default Login;