import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiAlertTriangle, FiCheck, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

// Constants
const API_URL = 'http://localhost:5000';
const API_FALLBACK_URL = 'http://127.0.0.1:5000';

// Types of attacks mapped to friendly names
const ATTACK_TYPES: Record<string, string> = {
  '0': 'Mirai Attack',
  '1': 'Bashlite Attack',
  '2': 'Torii Attack',
  '3': 'Normal Traffic',
  'benign': 'Normal Traffic',
  'mirai': 'Mirai Attack',
  'bashlite': 'Bashlite Attack',
  'torii': 'Torii Attack',
  'scan': 'Scanning Attack',
  'dos': 'Denial of Service',
  'gafgyt': 'Gafgyt Botnet',
  'unknown': 'Unknown Attack'
};

// Interface for component props
interface ResultsComponentProps {
  filename: string;
  onReset: () => void;
}

// Interface for results data
interface ResultsData {
  total_rows?: number;
  anomalies_flagged?: number;
  autoencoder_threshold?: number;
  reconstruction_errors?: number[];
  cnn_predictions?: Record<string, number>;
  prediction_counts?: Record<string, number>;
  anomaly_score?: number;
  confidence_score?: number;
  processing_time?: number;
  timestamp?: string;
  imageFolder?: string;
  status?: string;
  error?: string;
  note?: string;
  fileSize?: string;
}

const ResultsComponent: React.FC<ResultsComponentProps> = ({ filename, onReset }) => {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(API_URL);
  
  // Check server connection and fetch results
  useEffect(() => {
    const checkServerAndFetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to connect to the primary API endpoint
        const healthResponse = await fetch(`${API_URL}/api/health`);
        if (healthResponse.ok) {
          setApiBaseUrl(API_URL);
          await fetchResults(API_URL);
          return;
        }
      } catch (error) {
        console.log('Primary server connection failed, trying fallback URL');
      }
      
      try {
        // Try the fallback URL
        const fallbackHealthResponse = await fetch(`${API_FALLBACK_URL}/api/health`);
        if (fallbackHealthResponse.ok) {
          setApiBaseUrl(API_FALLBACK_URL);
          await fetchResults(API_FALLBACK_URL);
          return;
        }
      } catch (fallbackError) {
        setLoading(false);
        setError('Server connection failed. Please ensure the backend server is running.');
        console.error('Both server connections failed:', fallbackError);
      }
    };
    
    checkServerAndFetchResults();
  }, [filename]);
  
  // Fetch results from the API
  const fetchResults = async (baseUrl: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/results?filename=${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results data. Please try again.');
      setLoading(false);
    }
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!results) return [];
    
    const predictions = results.prediction_counts || 
                      (results.cnn_predictions ? transformPredictions(results.cnn_predictions) : {});
    
    return Object.entries(predictions).map(([key, value]) => ({
      name: ATTACK_TYPES[key] || key,
      value: value
    }));
  };
  
  // Transform cnn_predictions to prediction_counts format if needed
  const transformPredictions = (cnnPredictions: Record<string, number>) => {
    const counts: Record<string, number> = {};
    
    Object.values(cnnPredictions).forEach(typeIndex => {
      const key = typeIndex.toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return counts;
  };
  
  // Get attack distribution percentage
  const getPercentage = (type: string) => {
    if (!results) return 0;
    
    const predictions = results.prediction_counts || 
                      (results.cnn_predictions ? transformPredictions(results.cnn_predictions) : {});
    
    const total = Object.values(predictions).reduce((acc, val) => acc + val, 0);
    const value = predictions[type] || 0;
    
    return ((value / total) * 100).toFixed(1);
  };
  
  // Generate colors for pie chart
  const COLORS = ['#ef476f', '#ffd166', '#118ab2', '#06d6a0', '#073b4c', '#6c757d'];
  
  // Determine security status based on results
  const getSecurityStatus = () => {
    if (!results) return 'unknown';
    
    const predictions = results.prediction_counts || 
                      (results.cnn_predictions ? transformPredictions(results.cnn_predictions) : {});
    
    // Check if Normal Traffic or benign is the dominant class
    const normalTrafficKeys = ['3', 'benign'];
    const normalTrafficPercentage = normalTrafficKeys.reduce((sum, key) => {
      return sum + (parseFloat(getPercentage(key)) || 0);
    }, 0);
    
    if (normalTrafficPercentage >= 95) return 'secure';
    if (normalTrafficPercentage >= 80) return 'warning';
    return 'danger';
  };
  
  // Retry loading results
  const handleRetry = () => {
    checkServerAndFetchResults();
  };
  
  // Check server and fetch results again
  const checkServerAndFetchResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await fetchResults(apiBaseUrl);
    } catch (error) {
      setError('Failed to fetch results. Please try again.');
      setLoading(false);
    }
  };
  
  // Format processing time
  const formatProcessingTime = (time?: number): string => {
    if (!time) return '0.00s';
    return time < 1 ? `${(time * 1000).toFixed(0)}ms` : `${time.toFixed(2)}s`;
  };

  // Get normal traffic percentage
  const getNormalTrafficPercentage = (): number => {
    if (!results) return 0;
    
    // Combine percentages from all normal traffic categories
    const normalKeys = ['3', 'benign'];
    return normalKeys.reduce((sum, key) => {
      return sum + parseFloat(getPercentage(key) || '0');
    }, 0);
  };

  // Format percentage
  const formatPercentage = (value?: string | number): string => {
    if (value === undefined || value === null) return '0.0%';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(1)}%`;
  };
  
  // Format score (0-1 range)
  const formatScore = (score?: string | number): string => {
    if (score === undefined || score === null) return '0.00';
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    return numScore.toFixed(2);
  };
  
  // Get dominant attack type
  const getDominantAttackType = () => {
    if (!results) return null;
    
    const predictions = results.prediction_counts || 
                      (results.cnn_predictions ? transformPredictions(results.cnn_predictions) : {});
    
    // Filter out the benign/normal traffic (keys '3' and 'benign')
    const attackKeys = Object.keys(predictions).filter(key => key !== '3' && key !== 'benign');
    if (attackKeys.length === 0) return null;
    
    // Find the attack type with the highest count
    const dominantAttack = attackKeys.reduce((max, key) => 
      (predictions[key] > predictions[max] ? key : max), attackKeys[0]);
    
    return {
      type: dominantAttack,
      name: ATTACK_TYPES[dominantAttack] || `Unknown Attack (${dominantAttack})`,
      percentage: getPercentage(dominantAttack)
    };
  };

  // Get info about attack types
  const getAttackInfo = (attackType: string): {description: string, severity: string, recommendations: string[]} => {
    const attackInfoMap: Record<string, {description: string, severity: string, recommendations: string[]}> = {
      '0': {
        description: "Mirai is a malware that infects IoT devices to create botnets for large-scale DDoS attacks. It primarily targets devices with default credentials.",
        severity: "Critical",
        recommendations: [
          "Change default passwords on all IoT devices",
          "Isolate IoT devices on a separate network",
          "Block suspicious outbound connection attempts",
          "Update firmware on all connected devices"
        ]
      },
      '1': {
        description: "Bashlite (also known as Gafgyt) is a DDoS botnet malware that exploits shell vulnerabilities to compromise Linux-based IoT devices.",
        severity: "High",
        recommendations: [
          "Patch all Linux devices with latest security updates",
          "Implement network segmentation",
          "Monitor for unusual shell commands",
          "Restrict remote access to IoT devices"
        ]
      },
      '2': {
        description: "Torii is a sophisticated IoT malware with advanced persistence and data exfiltration capabilities, targeting a wide range of CPU architectures.",
        severity: "Critical",
        recommendations: [
          "Implement strict network monitoring",
          "Check for persistent connections to unknown servers",
          "Deploy IoT-specific security solutions",
          "Review all outbound traffic for data exfiltration"
        ]
      }
    };
    
    return attackInfoMap[attackType] || {
      description: "Unknown attack pattern detected in network traffic.",
      severity: "Unknown",
      recommendations: [
        "Isolate affected devices",
        "Capture and analyze network traffic",
        "Contact security team for further analysis"
      ]
    };
  };
  
  if (loading) {
    return (
      <div className="results-loading">
        <LoadingSpinner size="lg" text="Analyzing network data..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="results-error">
        <motion.div 
          className="error-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="error-icon">
            <FiAlertTriangle />
          </div>
          <h2 className="error-title">Error Loading Results</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={handleRetry}
            >
              <FiRefreshCw className="button-icon" /> Retry
            </button>
            <button 
              className="btn btn-outline"
              onClick={onReset}
            >
              Back to Upload
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  const securityStatus = getSecurityStatus();
  const chartData = prepareChartData();
  
  return (
    <div className="results-component">
      <motion.div 
        className="results-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-title">Analysis Results</h2>
        <p className="section-description">
          Network traffic analysis for <span className="filename">{filename}</span>
        </p>
      </motion.div>
      
      <motion.div 
        className={`security-status security-${securityStatus}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {securityStatus === 'secure' && (
          <>
            <div className="status-icon secure-icon">
              <FiCheck />
            </div>
            <div className="status-text">
              <h3>Network is Secure</h3>
              <p>No malicious traffic patterns detected.</p>
            </div>
          </>
        )}
        
        {securityStatus === 'warning' && (
          <>
            <div className="status-icon warning-icon">
              <FiAlertTriangle />
            </div>
            <div className="status-text">
              <h3>Potential Threats Detected</h3>
              <p>Some suspicious traffic patterns were found.</p>
            </div>
          </>
        )}
        
        {securityStatus === 'danger' && (
          <>
            <div className="status-icon danger-icon">
              <FiAlertTriangle />
            </div>
            <div className="status-text">
              <h3>Critical Threats Detected</h3>
              <p>Significant malicious activity detected. Immediate action recommended.</p>
            </div>
          </>
        )}
      </motion.div>
      
      {/* Attack Details Section - New */}
      {securityStatus === 'danger' && getDominantAttackType() && (
        <motion.div
          className="attack-details-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="attack-details-card">
            <div className="attack-header">
              <div className="attack-icon">
                {getDominantAttackType()?.type === '0' && <span className="attack-icon-mirai">M</span>}
                {getDominantAttackType()?.type === '1' && <span className="attack-icon-bashlite">B</span>}
                {getDominantAttackType()?.type === '2' && <span className="attack-icon-torii">T</span>}
                {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && <span className="attack-icon-unknown">?</span>}
              </div>
              <div className="attack-title">
                <h3>{getDominantAttackType()?.name}</h3>
                <div className="attack-severity" data-severity={getAttackInfo(getDominantAttackType()?.type || '').severity.toLowerCase()}>
                  {getAttackInfo(getDominantAttackType()?.type || '').severity} Threat
                </div>
              </div>
              <div className="attack-percentage">
                <span className="percentage-value">{getDominantAttackType()?.percentage}%</span>
                <span className="percentage-label">of traffic</span>
              </div>
            </div>
            
            <div className="attack-body">
              <p className="attack-description">
                {getAttackInfo(getDominantAttackType()?.type || '').description}
              </p>
              
              <div className="attack-recommendations">
                <h4>Recommended Actions</h4>
                <ul className="recommendations-list">
                  {getAttackInfo(getDominantAttackType()?.type || '').recommendations.map((rec, index) => (
                    <li key={index} className="recommendation-item">
                      <motion.span 
                        className="check-icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + (index * 0.1) }}
                      >
                        ✓
                      </motion.span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="results-content">
        <motion.div 
          className="results-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chart-container">
            <h3 className="chart-title">Traffic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} packets`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="results-metrics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="metrics-title">Analysis Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h4 className="metric-name">Normal Traffic</h4>
              <p className="metric-value">{formatPercentage(getNormalTrafficPercentage())}</p>
            </div>
            <div className="metric-card">
              <h4 className="metric-name">Anomaly Score</h4>
              <p className="metric-value">{formatScore(results?.anomaly_score)}</p>
            </div>
            <div className="metric-card">
              <h4 className="metric-name">Confidence</h4>
              <p className="metric-value">{formatScore(results?.confidence_score)}</p>
            </div>
            <div className="metric-card">
              <h4 className="metric-name">Processing Time</h4>
              <p className="metric-value">{formatProcessingTime(results?.processing_time)}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="results-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="details-title">Detailed Findings</h3>
          <div className="details-content">
            <div className="details-section">
              <h4 className="section-subtitle">Attack Types Detected</h4>
              <ul className="attack-list">
                {chartData
                  .filter(item => !item.name.includes('Normal') && item.value > 0)
                  .map((item, index) => (
                    <li key={index} className="attack-item">
                      <div className="attack-type">{item.name}</div>
                      <div className="attack-count">{item.value} packets ({(item.value / chartData.reduce((acc, curr) => acc + curr.value, 0) * 100).toFixed(1)}%)</div>
                    </li>
                  ))}
                {chartData.filter(item => !item.name.includes('Normal') && item.value > 0).length === 0 && (
                  <li className="attack-item attack-none">
                    <div className="attack-type">No attacks detected</div>
                    <div className="attack-count">100% normal traffic</div>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="details-section">
              <h4 className="section-subtitle">Recommended Actions</h4>
              <ul className="action-list">
                {securityStatus === 'secure' && (
                  <>
                    <li className="action-item">Continue monitoring network traffic regularly</li>
                    <li className="action-item">Keep security systems and IoT firmware updated</li>
                    <li className="action-item">Maintain device inventory and security policies</li>
                  </>
                )}
                {securityStatus === 'warning' && (
                  <>
                    <li className="action-item">Investigate devices showing suspicious activity</li>
                    <li className="action-item">Check for outdated firmware and update immediately</li>
                    <li className="action-item">Review network segmentation and access controls</li>
                    <li className="action-item">Increase monitoring frequency</li>
                  </>
                )}
                {securityStatus === 'danger' && (
                  <>
                    <li className="action-item">Isolate affected devices immediately</li>
                    <li className="action-item">Run deep security scans on all network devices</li>
                    <li className="action-item">Review and update all access credentials</li>
                    <li className="action-item">Apply security patches and firmware updates</li>
                    <li className="action-item">Consider professional security assessment</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* Attack Timeline - New Section */}
          {securityStatus === 'danger' && getDominantAttackType() && (
            <motion.div
              className="attack-timeline-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h4 className="section-subtitle">Attack Pattern Timeline</h4>
              <div className="timeline-container">
                <div className="timeline-phases">
                  <div className="timeline-phase">
                    <div className="phase-marker" data-phase="reconnaissance">
                      <span className="phase-number">1</span>
                    </div>
                    <div className="phase-details">
                      <h5 className="phase-title">Reconnaissance</h5>
                      <p className="phase-description">
                        {getDominantAttackType()?.type === '0' && 'Initial scanning for vulnerable IoT devices with default credentials'}
                        {getDominantAttackType()?.type === '1' && 'Probing for Linux-based devices with shell vulnerabilities'}
                        {getDominantAttackType()?.type === '2' && 'Advanced scanning for multiple device architectures'}
                        {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Device scanning and network mapping activity'}
                      </p>
                    </div>
                  </div>
                  <div className="timeline-phase">
                    <div className="phase-marker" data-phase="exploitation">
                      <span className="phase-number">2</span>
                    </div>
                    <div className="phase-details">
                      <h5 className="phase-title">Exploitation</h5>
                      <p className="phase-description">
                        {getDominantAttackType()?.type === '0' && 'Brute force attacks against telnet/SSH using default credentials'}
                        {getDominantAttackType()?.type === '1' && 'Exploitation of Bash vulnerabilities to gain shell access'}
                        {getDominantAttackType()?.type === '2' && 'Multi-vector exploitation with advanced persistence mechanisms'}
                        {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Attempting to exploit vulnerabilities in target systems'}
                      </p>
                    </div>
                  </div>
                  <div className="timeline-phase">
                    <div className="phase-marker" data-phase="installation">
                      <span className="phase-number">3</span>
                    </div>
                    <div className="phase-details">
                      <h5 className="phase-title">Installation</h5>
                      <p className="phase-description">
                        {getDominantAttackType()?.type === '0' && 'Download and installation of Mirai botnet malware'}
                        {getDominantAttackType()?.type === '1' && 'Deployment of Bashlite DDoS malware components'}
                        {getDominantAttackType()?.type === '2' && 'Installation of persistent Torii backdoors across multiple architectures'}
                        {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Malware installation and persistence mechanisms'}
                      </p>
                    </div>
                  </div>
                  <div className="timeline-phase">
                    <div className="phase-marker" data-phase="command">
                      <span className="phase-number">4</span>
                    </div>
                    <div className="phase-details">
                      <h5 className="phase-title">Command & Control</h5>
                      <p className="phase-description">
                        {getDominantAttackType()?.type === '0' && 'Connecting to C&C servers for botnet coordination'}
                        {getDominantAttackType()?.type === '1' && 'Establishing command channels for DDoS attack instructions'}
                        {getDominantAttackType()?.type === '2' && 'Advanced encrypted communications with C&C infrastructure'}
                        {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Establishing control channels with command servers'}
                      </p>
                    </div>
                  </div>
                  <div className="timeline-phase">
                    <div className="phase-marker" data-phase="actions">
                      <span className="phase-number">5</span>
                    </div>
                    <div className="phase-details">
                      <h5 className="phase-title">Actions on Objectives</h5>
                      <p className="phase-description">
                        {getDominantAttackType()?.type === '0' && 'Participation in coordinated DDoS attacks against targets'}
                        {getDominantAttackType()?.type === '1' && 'Execution of flood attacks against specified targets'}
                        {getDominantAttackType()?.type === '2' && 'Data exfiltration and long-term surveillance capabilities'}
                        {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Executing malicious activities based on attacker objectives'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="timeline-progress">
                  <div className="timeline-progress-bar" style={{ width: '100%' }}></div>
                </div>
                <div className="timeline-indicators">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="timeline-indicator" 
                      style={{ left: `${(i / 4) * 100}%` }}
                    ></div>
                  ))}
                </div>
              </div>
              <div className="timeline-legend">
                <p className="timeline-note">This timeline represents the typical attack progression for {getDominantAttackType()?.name}.</p>
                <p className="timeline-action">Consider implementing defensive measures at each phase to break the attack chain.</p>
              </div>
              
              {/* Technical Details Table */}
              <div className="technical-details">
                <h4 className="tech-title">Technical Details</h4>
                <div className="tech-table-container">
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Attack Classification</td>
                        <td>
                          <span className="tech-value">{getDominantAttackType()?.name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Severity Level</td>
                        <td>
                          <span className="severity-badge" data-severity={getAttackInfo(getDominantAttackType()?.type || '').severity.toLowerCase()}>
                            {getAttackInfo(getDominantAttackType()?.type || '').severity}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Prevalence</td>
                        <td>{getDominantAttackType()?.percentage}% of analyzed traffic</td>
                      </tr>
                      <tr>
                        <td>Protocol(s)</td>
                        <td>
                          {getDominantAttackType()?.type === '0' && 'TCP/UDP, HTTP, Telnet, SSH'}
                          {getDominantAttackType()?.type === '1' && 'TCP/UDP, HTTP, Shell, IRC'}
                          {getDominantAttackType()?.type === '2' && 'TCP/UDP, ICMP, HTTP/HTTPS, Custom Protocols'}
                          {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Multiple (TCP/UDP)'}
                        </td>
                      </tr>
                      <tr>
                        <td>Targeted Devices</td>
                        <td>
                          {getDominantAttackType()?.type === '0' && 'IP Cameras, DVRs, Routers, IoT Devices with Default Credentials'}
                          {getDominantAttackType()?.type === '1' && 'Linux-based Routers, Servers, IoT Devices'}
                          {getDominantAttackType()?.type === '2' && 'Multi-architecture IoT Devices (MIPS, ARM, x86, PowerPC, etc.)'}
                          {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Various Network-connected Devices'}
                        </td>
                      </tr>
                      <tr>
                        <td>Common Ports</td>
                        <td>
                          {getDominantAttackType()?.type === '0' && '23/TCP (Telnet), 22/TCP (SSH), 2323/TCP (Alt-Telnet), 80/TCP (HTTP)'}
                          {getDominantAttackType()?.type === '1' && '22/TCP (SSH), 23/TCP (Telnet), 80/TCP (HTTP), 6667/TCP (IRC)'}
                          {getDominantAttackType()?.type === '2' && '23/TCP, 2223/TCP, 22/TCP, 80/TCP, 443/TCP, 8080/TCP, 8888/TCP'}
                          {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 'Various (20+ ports)'}
                        </td>
                      </tr>
                      <tr>
                        <td>Detection Method</td>
                        <td>
                          <span className="detection-method">
                            <span className="detection-badge">Behavioral</span>
                            <span className="detection-badge">Traffic Pattern</span>
                            <span className="detection-badge">ML Classification</span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Reference(s)</td>
                        <td>
                          {getDominantAttackType()?.type === '0' && 
                            <a href="https://attack.mitre.org/techniques/T1595/" target="_blank" rel="noopener noreferrer" className="reference-link">
                              MITRE ATT&CK T1595: Active Scanning
                            </a>
                          }
                          {getDominantAttackType()?.type === '1' && 
                            <a href="https://attack.mitre.org/techniques/T1190/" target="_blank" rel="noopener noreferrer" className="reference-link">
                              MITRE ATT&CK T1190: Exploit Public-Facing Application
                            </a>
                          }
                          {getDominantAttackType()?.type === '2' && 
                            <a href="https://attack.mitre.org/techniques/T1059/" target="_blank" rel="noopener noreferrer" className="reference-link">
                              MITRE ATT&CK T1059: Command and Scripting Interpreter
                            </a>
                          }
                          {!['0', '1', '2'].includes(getDominantAttackType()?.type || '') && 
                            <a href="https://attack.mitre.org/techniques/" target="_blank" rel="noopener noreferrer" className="reference-link">
                              MITRE ATT&CK Techniques
                            </a>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      <motion.div 
        className="results-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <button 
          className="btn btn-outline"
          onClick={onReset}
        >
          Analyze Another File
        </button>
      </motion.div>
    </div>
  );
};

export default ResultsComponent; 