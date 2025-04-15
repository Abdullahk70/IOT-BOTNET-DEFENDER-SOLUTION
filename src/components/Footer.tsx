import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiGithub, FiLinkedin, FiTwitter, FiMail } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      }
    }
  };
  
  // Social links with animations
  const socialLinks = [
    { icon: <FiGithub />, url: '#', label: 'GitHub' },
    { icon: <FiTwitter />, url: '#', label: 'Twitter' },
    { icon: <FiLinkedin />, url: '#', label: 'LinkedIn' },
    { icon: <FiMail />, url: '#', label: 'Email' }
  ];
  
  // Footer links
  const footerLinks = [
    { name: 'Privacy Policy', url: '#' },
    { name: 'Terms of Service', url: '#' },
    { name: 'Contact Us', url: '#' }
  ];
  
  return (
    <footer style={{ backgroundColor: 'var(--gray-100)' }}>
      <div className="container">
        <motion.div 
          className="footer-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '40px',
            marginBottom: '30px'
          }}
        >
          <motion.div 
            className="footer-left" 
            variants={itemVariants}
            style={{
              flex: '2',
              minWidth: '280px'
            }}
          >
            <div className="footer-logo">
              <div 
                className="footer-logo-icon"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                }}
              >
                <FiActivity />
              </div>
              <span className="footer-logo-text">NetGuardian</span>
            </div>
            <p 
              className="footer-description"
              style={{
                marginBottom: '30px',
                lineHeight: '1.6',
                maxWidth: '400px'
              }}
            >
              Advanced machine learning platform for IoT network security. 
              Detect, analyze, and prevent malicious botnet attacks in real-time.
            </p>
            <div 
              className="social-links"
              style={{
                display: 'flex',
                gap: '16px'
              }}
            >
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.url}
                  className="social-link"
                  aria-label={link.label}
                  whileHover={{ 
                    scale: 1.1, 
                    backgroundColor: 'var(--primary-color)',
                    color: 'white'
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '20px',
                    backgroundColor: 'white',
                    color: 'var(--text-color-light)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="footer-right" 
            variants={itemVariants}
            style={{
              flex: '1',
              minWidth: '200px'
            }}
          >
            <h3 
              className="footer-subtitle"
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--heading-color)',
                marginBottom: '20px',
                position: 'relative',
                display: 'inline-block'
              }}
            >
              Quick Links
            </h3>
            <ul 
              className="footer-nav"
              style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}
            >
              {['Home', 'Analysis', 'Documentation', 'About'].map((item, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    marginBottom: '12px'
                  }}
                >
                  <a 
                    href="#" 
                    className="animated-link"
                    style={{
                      color: 'var(--text-color)',
                      transition: 'color var(--transition-fast)',
                      padding: '5px 0',
                      display: 'inline-block'
                    }}
                  >
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="footer-bottom"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <p 
            className="copyright"
            style={{
              color: 'var(--text-color-light)',
              fontSize: '14px'
            }}
          >
            &copy; {currentYear} NetGuardian. All rights reserved.
          </p>
          
          <div 
            className="footer-links"
            style={{
              display: 'flex',
              gap: '20px'
            }}
          >
            {footerLinks.map((link, index) => (
              <a 
                key={index} 
                href={link.url} 
                className="footer-link animated-link"
                style={{
                  color: 'var(--text-color-light)',
                  fontSize: '14px',
                  transition: 'color 0.2s ease'
                }}
              >
                {link.name}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 