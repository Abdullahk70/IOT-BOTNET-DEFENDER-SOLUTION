import React, { useState } from "react";
import { motion } from "framer-motion";
import Login from "./Login";
import Register from "./Register";

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleSwitchToLogin = () => {
    setAuthMode("login");
  };

  const handleSwitchToRegister = () => {
    setAuthMode("register");
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-page-container">
        <div className="auth-page-content">
          <div className="auth-page-branding">
            <div className="auth-logo-container">
              <div className="auth-logo-icon"></div>
              <h1 className="auth-logo-text">IoT-Botnet-Defender</h1>
            </div>
            <p className="auth-tagline">
              Secure your IoT environment with advanced botnet detection
            </p>
          </div>

          <div className="auth-page-form">
            {authMode === "login" ? (
              <Login
                onLogin={onAuthSuccess}
                onSwitchToRegister={handleSwitchToRegister}
              />
            ) : (
              <Register
                onRegister={onAuthSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthPage;
