import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiShield, FiServer, FiCpu, FiBarChart2, FiAlertTriangle, FiArrowRight, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';

interface HomePageProps {
  onStartAnalysis: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartAnalysis }) => {
  const controls = useAnimation();
  
  // Start animations when component mounts
  useEffect(() => {
    controls.start("visible");
  }, [controls]);
  
  // Animation variants - optimized for performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'tween', 
        duration: 0.4
      }
    }
  };
  
  // Hero section animations
  const titleWords = "Detect and Analyze Attacks".split(' ');
  
  const titleWordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5
      }
    })
  };
  
  const backgroundGlowVariants = {
    initial: {
      opacity: 0.2,
      scale: 0.9,
    },
    animate: {
      opacity: [0.1, 0.2, 0.1],
      scale: [0.9, 1, 0.9],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }
    }
  };
  
  const floatingImageVariants = {
    initial: { y: 0 },
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }
    }
  };
  
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };
  
  const arrowVariants = {
    initial: { x: 0 },
    hover: { 
      x: 5,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const, 
        duration: 0.4 
      }
    }
  };
  
  // Stats data
  const stats = [
    { value: "99.8%", label: "Detection Accuracy" },
    { value: "500+", label: "Threats Detected Daily" },
    { value: "1.2M+", label: "IoT Devices Protected" },
    { value: "<2s", label: "Response Time" }
  ];
  
  // Feature cards data
  const features = [
    {
      icon: <FiShield />,
      title: "Real-time Detection",
      description: "Identify malicious IoT botnet traffic as it happens, with advanced pattern recognition that can detect even zero-day threats."
    },
    {
      icon: <FiServer />,
      title: "Network Monitoring",
      description: "Continuously scan your IoT devices and network connections for suspicious behavior with minimal performance impact."
    },
    {
      icon: <FiCpu />,
      title: "Smart Analysis",
      description: "AI-powered system that learns from new attack patterns to improve detection accuracy across your entire device ecosystem."
    },
    {
      icon: <FiBarChart2 />,
      title: "Detailed Reporting",
      description: "Get comprehensive insights with visual representations of detected threats and actionable security recommendations."
    },
    {
      icon: <FiAlertTriangle />,
      title: "Threat Classification",
      description: "Automatically categorize threats by type, severity, and affected devices to prioritize critical security issues."
    }
  ];
  
  // Additional security benefits
  const securityBenefits = [
    { icon: <FiCheckCircle />, title: "Zero False Positives", description: "Advanced machine learning algorithms ensure you only get alerted to real threats." },
    { icon: <FiClock />, title: "24/7 Protection", description: "Continuous monitoring ensures your network is protected around the clock." },
    { icon: <FiUsers />, title: "Expert Support", description: "Access to security experts who can help with complex threat analysis and mitigation." }
  ];
  
  return (
    <div className="home-page">
      {/* Preload container for critical assets */}
      <div className="preload-container">
        <img src="/images/network-security.svg" alt="" />
      </div>
      
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        backgroundColor: '#ffffff', 
        background: '#ffffff',
        color: 'var(--text-color)',
        position: 'relative'
      }}>
        <motion.div
          className="hero-background-glow"
          variants={backgroundGlowVariants}
          initial="initial"
          animate="animate"
          style={{
            background: 'radial-gradient(circle, rgba(26, 86, 219, 0.1) 0%, rgba(26, 86, 219, 0) 70%)'
          }}
        />
        
        <div className="container">
          <div className="hero-content">
            <motion.div 
              className="hero-text"
              variants={containerVariants}
              initial="hidden"
              animate={controls}
            >
              <motion.h1 
                className="hero-title" 
                variants={itemVariants}
                style={{ 
                  color: 'black', 
                  fontWeight: 800,
                  fontSize: '3.5rem',
                  textShadow: 'none',
                  marginBottom: '24px'
                }}
              >
                Detect and Analyze Attacks
              </motion.h1>
              
              <motion.p 
                className="hero-description"
                variants={itemVariants}
                style={{ 
                  color: 'black', 
                  fontSize: '1.25rem',
                  lineHeight: '1.7',
                  marginBottom: '1.5rem',
                  fontWeight: '500',
                  textShadow: 'none'
                }}
              >
                Our advanced machine learning platform helps you identify, classify, and prevent malicious botnet traffic within your IoT network infrastructure. Get real-time alerts and comprehensive threat analysis.
              </motion.p>
              
              <motion.div
                variants={itemVariants}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '2rem'
                }}
              >
                <motion.button
                  className="btn btn-primary start-btn"
                  onClick={onStartAnalysis}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  style={{
                    background: 'linear-gradient(90deg, #1a56db, #7e22ce)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    fontSize: '1.1rem',
                    padding: '14px 28px',
                    borderRadius: '9999px',
                    fontWeight: '600',
                    border: 'none'
                  }}
                >
                  Start Analysis 
                  <motion.span 
                    className="btn-icon"
                    variants={arrowVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <FiArrowRight />
                  </motion.span>
                </motion.button>
                
                <motion.a
                  href="#features"
                  className="btn btn-outline"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  style={{
                    border: '2px solid #1a56db',
                    color: '#1a56db',
                    padding: '14px 28px',
                    borderRadius: '9999px',
                    fontWeight: '600',
                    background: 'white'
                  }}
                >
                  Learn More
                </motion.a>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="hero-image"
              variants={floatingImageVariants}
              initial="initial"
              animate="animate"
            >
              <img src="/images/network-security.svg" alt="IoT Network Security" />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="section-title" style={{ color: 'var(--heading-color)' }}>Key Features</h2>
            <p className="section-description" style={{ color: 'var(--text-color)' }}>
              Explore how NetGuardian helps protect your IoT devices from emerging threats
            </p>
          </motion.div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "var(--shadow-lg)", 
                  borderColor: "var(--primary-color)",
                  transition: { duration: 0.2 }
                }}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <motion.div 
                  className="feature-icon"
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "var(--primary-color)",
                    color: "white",
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                    color: 'var(--primary-color)'
                  }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="feature-title" style={{ color: 'var(--heading-color)' }}>{feature.title}</h3>
                <p className="feature-description" style={{ color: 'var(--text-color)' }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Additional Benefits Section */}
      <section className="benefits-section" style={{ padding: '50px 0', backgroundColor: 'white' }}>
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="section-title" style={{ color: 'var(--heading-color)' }}>Why Choose NetGuardian</h2>
            <p className="section-description" style={{ color: 'var(--text-color)' }}>
              Our solution provides superior protection with industry-leading technology
            </p>
          </motion.div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '30px', 
            justifyContent: 'center',
            marginTop: '40px'
          }}>
            {securityBenefits.map((benefit, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                style={{
                  flex: '1',
                  minWidth: '280px',
                  maxWidth: '350px',
                  padding: '30px',
                  backgroundColor: 'white',
                  borderRadius: 'var(--border-radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                whileHover={{
                  y: -5,
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginRight: '15px'
                  }}>
                    {benefit.icon}
                  </div>
                  <h3 style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: 'var(--heading-color)'
                  }}>
                    {benefit.title}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-color)', lineHeight: '1.6' }}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section style={{ 
        padding: '60px 0', 
        backgroundColor: 'var(--primary-light)',
        textAlign: 'center'
      }}>
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ 
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--heading-color)',
              marginBottom: '20px'
            }}
          >
            Ready to Secure Your IoT Network?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ 
              fontSize: '1.1rem',
              color: 'var(--text-color)',
              maxWidth: '600px',
              margin: '0 auto 30px'
            }}
          >
            Start analyzing your network traffic today and detect potential threats before they become a problem.
          </motion.p>
          
          <motion.button
            className="btn btn-primary"
            onClick={onStartAnalysis}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
              color: 'white',
              padding: '16px 36px',
              fontSize: '1.1rem',
              borderRadius: '9999px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            Start Free Analysis
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 