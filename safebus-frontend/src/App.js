import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, MapPin, Clock, Bell, Users, Bus, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Service
const API = {
  // Generate OTP
  generateOTP: async (contact, contactType) => {
    const response = await fetch(`${API_BASE_URL}/auth/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, contactType })
    });
    return await response.json();
  },
  
  // Login with OTP
  login: async (contact, password, otp, userType) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, password, otp, userType })
    });
    return await response.json();
  },
  
  // Get bus location
  getBusLocation: async (busId, token) => {
    const response = await fetch(`${API_BASE_URL}/parent/bus-location/${busId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Get trip timeline
  getTripTimeline: async (routeId, token) => {
    const response = await fetch(`${API_BASE_URL}/parent/trip-timeline/${routeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Get notifications
  getNotifications: async (token) => {
    const response = await fetch(`${API_BASE_URL}/parent/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Get students for driver
  getStudents: async (busId, token) => {
    const response = await fetch(`${API_BASE_URL}/driver/students/${busId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Mark attendance
  markAttendance: async (childId, busId, status, token) => {
    const response = await fetch(`${API_BASE_URL}/driver/attendance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ childId, busId, status })
    });
    return await response.json();
  },
  
  // Update bus location
  updateLocation: async (busId, latitude, longitude, speed, token) => {
    const response = await fetch(`${API_BASE_URL}/driver/update-location`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ busId, latitude, longitude, speed })
    });
    return await response.json();
  },
  
  // Send emergency alert
  sendEmergencyAlert: async (driverId, busId, type, description, token) => {
    const response = await fetch(`${API_BASE_URL}/driver/emergency-alert`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ driverId, busId, type, description })
    });
    return await response.json();
  },
  
  // Get admin dashboard
  getDashboardData: async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Send broadcast notification
  sendNotification: async (message, targetRole, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/send-notification`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ message, targetRole })
    });
    return await response.json();
  },
  
  // Add new student
  addStudent: async (studentData, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/add-student`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(studentData)
    });
    return await response.json();
  },
  
  // Get all routes
  getRoutes: async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Get stops for a route
  getStops: async (routeId, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/stops/${routeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },
  
  // Get all students
  getStudents: async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
};

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentView('landing');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView(`${userData.type}-dashboard`);
  };

  // Check for saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      const userType = JSON.parse(savedUser).type;
      setCurrentView(`${userType}-dashboard`);
    }
  }, []);

  return (
    <div style={styles.app}>
      {currentView === 'landing' && <LandingPage setCurrentView={setCurrentView} />}
      {currentView === 'parent-login' && <LoginPage userType="parent" onLoginSuccess={handleLoginSuccess} setCurrentView={setCurrentView} />}
      {currentView === 'driver-login' && <LoginPage userType="driver" onLoginSuccess={handleLoginSuccess} setCurrentView={setCurrentView} />}
      {currentView === 'admin-login' && <LoginPage userType="admin" onLoginSuccess={handleLoginSuccess} setCurrentView={setCurrentView} />}
      {currentView === 'parent-dashboard' && user && <ParentDashboard user={user} token={token} onLogout={handleLogout} />}
      {currentView === 'driver-dashboard' && user && <DriverDashboard user={user} token={token} onLogout={handleLogout} />}
      {currentView === 'admin-dashboard' && user && <AdminDashboard user={user} token={token} onLogout={handleLogout} />}
    </div>
  );
}

// Landing Page
function LandingPage({ setCurrentView }) {
  return (
    <div style={styles.landing}>
      <nav style={styles.landingNav}>
        <div style={styles.logo}>
          <Bus size={32} color="#2563eb" />
          <span style={styles.logoText}>KidRideGuard</span>
        </div>
        <div style={styles.navButtons}>
          <button style={styles.navButton} onClick={() => setCurrentView('parent-login')}>Parent Login</button>
          <button style={styles.navButton} onClick={() => setCurrentView('driver-login')}>Driver Login</button>
          <button style={{...styles.navButton, ...styles.navButtonPrimary}} onClick={() => setCurrentView('admin-login')}>Admin Login</button>
        </div>
      </nav>

      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>School Bus Tracking Made Simple & Secure</h1>
          <p style={styles.heroSubtitle}>Real-time tracking, instant alerts, and complete peace of mind for parents, drivers, and administrators</p>
          <div style={styles.heroButtons}>
            <button style={styles.heroPrimaryBtn} onClick={() => setCurrentView('parent-login')}>Get Started</button>
            <button style={styles.heroSecondaryBtn}>Watch Demo</button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.floatingCard}>
            <MapPin size={40} color="#2563eb" />
            <p style={styles.floatingCardText}>Live GPS Tracking</p>
          </div>
        </div>
      </section>

      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Comprehensive Solution for School Transportation</h2>
        <div style={styles.featureGrid}>
          <FeatureCard 
            icon={<Phone size={32} color="#2563eb" />}
            title="Parent App"
            items={[
              'Real-time bus location tracking',
              'Instant boarding/deboarding alerts',
              'ETA notifications for pickup',
              'Complete trip history',
              'Emergency contact system'
            ]}
          />
          <FeatureCard 
            icon={<Users size={32} color="#2563eb" />}
            title="Driver App"
            items={[
              'One-tap trip start/stop',
              'GPS auto-sharing every 10 sec',
              'Quick student attendance',
              'Emergency alert button',
              'Offline data sync capability'
            ]}
          />
          <FeatureCard 
            icon={<Shield size={32} color="#2563eb" />}
            title="Admin Panel"
            items={[
              'Manage buses, drivers & routes',
              'Live dashboard monitoring',
              'Student & parent database',
              'Route optimization tools',
              'Analytics & reporting'
            ]}
          />
        </div>
      </section>

      <section style={styles.stats}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>10K+</h3>
          <p style={styles.statLabel}>Active Students</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>500+</h3>
          <p style={styles.statLabel}>School Buses</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>99.9%</h3>
          <p style={styles.statLabel}>Uptime</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>24/7</h3>
          <p style={styles.statLabel}>Support</p>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>© 2025 KidRideGuard - Secure School Transportation Management</p>
        <p style={styles.footerLinks}>Privacy Policy • Terms of Service • Contact Us</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, items }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <ul style={styles.featureList}>
        {items.map((item, i) => (
          <li key={i} style={styles.featureItem}>
            <CheckCircle size={16} color="#10b981" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Login Page Component
function LoginPage({ userType, onLoginSuccess, setCurrentView }) {
  const [step, setStep] = useState('credentials');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactType, setContactType] = useState('email');

  const userTitles = {
    parent: 'Parent Portal',
    driver: 'Driver Portal',
    admin: 'Admin Panel'
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!contact || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await API.generateOTP(contact, contactType);
      if (result.success) {
        setStep('otp');
        setError(''); // Clear any previous errors
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please check your connection.');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await API.login(contact, password, otp, userType);
      if (result.success) {
        onLoginSuccess(result.user, result.token);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginContainer}>
        <div style={styles.loginHeader}>
          <Bus size={40} color="#2563eb" />
          <h2 style={styles.loginTitle}>{userTitles[userType]}</h2>
          <p style={styles.loginSubtitle}>Sign in to access your dashboard</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleSendOTP} style={styles.loginForm}>
            <div style={styles.toggleContainer}>
              <button
                type="button"
                style={{...styles.toggleBtn, ...(contactType === 'email' ? styles.toggleBtnActive : {})}}
                onClick={() => setContactType('email')}
              >
                <Mail size={18} />
                Email
              </button>
              <button
                type="button"
                style={{...styles.toggleBtn, ...(contactType === 'phone' ? styles.toggleBtnActive : {})}}
                onClick={() => setContactType('phone')}
              >
                <Phone size={18} />
                Phone
              </button>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                {contactType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div style={styles.inputWrapper}>
                {contactType === 'email' ? <Mail size={20} color="#6b7280" /> : <Phone size={20} color="#6b7280" />}
                <input
                  type={contactType === 'email' ? 'email' : 'tel'}
                  placeholder={contactType === 'email' ? 'your@email.com' : '+91 98765 43210'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={20} color="#6b7280" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </button>
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
            
            <div style={styles.demoCredentials}>
              <p style={styles.demoTitle}>Demo Credentials:</p>
              <p style={styles.demoText}>Email: {userType}@test.com</p>
              <p style={styles.demoText}>Password: {userType}123</p>
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={styles.loginForm}>
            <div style={styles.otpInfo}>
              <p style={styles.otpText}>OTP sent to {contact}</p>
              <button
                type="button"
                onClick={() => setStep('credentials')}
                style={styles.changeButton}
              >
                Change
              </button>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter OTP</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{...styles.input, ...styles.otpInput}}
                maxLength={6}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              style={styles.resendButton}
            >
              Resend OTP
            </button>
          </form>
        )}

        <button
          onClick={() => setCurrentView('landing')}
          style={styles.backButton}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// Parent Dashboard
function ParentDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('tracking');
  const [busLocation, setBusLocation] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const child = user.children?.[0];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      if (child?.bus) {
        const locationData = await API.getBusLocation(1, token); // Using bus_id = 1
        if (locationData.success) {
          setBusLocation(locationData);
        }
      }
      
      const timelineData = await API.getTripTimeline(1, token); // Using route_id = 1
      if (timelineData.success) {
        setTimeline(timelineData.timeline);
      }
      
      const notifData = await API.getNotifications(token);
      if (notifData.success) {
        setNotifications(notifData.notifications);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!child) {
    return <div style={styles.loading}>No child data found</div>;
  }

  return (
    <div style={styles.dashboard}>
      <nav style={styles.dashboardNav}>
        <div style={styles.logo}>
          <Bus size={28} color="#2563eb" />
          <span style={styles.logoText}>KidRideGuard</span>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user.name}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </nav>

      <div style={styles.dashboardContent}>
        <div style={styles.sidebar}>
          <button
            style={{...styles.sidebarButton, ...(activeTab === 'tracking' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveTab('tracking')}
          >
            <MapPin size={20} />
            Live Tracking
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeTab === 'child' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveTab('child')}
          >
            <Users size={20} />
            Child Details
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeTab === 'alerts' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} />
            Alerts
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeTab === 'timeline' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock size={20} />
            Trip Timeline
          </button>
        </div>

        <div style={styles.mainContent}>
          {activeTab === 'tracking' && (
            <div>
              <h2 style={styles.pageTitle}>Live Bus Tracking</h2>
              <div style={styles.trackingCard}>
                <div style={styles.statusBar}>
                  <div style={styles.statusBadge}>
                    <div style={styles.statusDot}></div>
                    {busLocation?.status === 'en_route' ? 'Bus En Route' : 'Bus Not Started'}
                  </div>
                  <div style={styles.etaText}>ETA: {busLocation?.eta || '--'} minutes</div>
                </div>
                <div style={styles.mapContainer}>
                  <MapPin size={60} color="#2563eb" />
                  <p style={styles.mapText}>Interactive Map</p>
                  <p style={styles.mapSubtext}>Bus location updates every 10 seconds</p>
                  {busLocation?.location && (
                    <div style={styles.locationInfo}>
                      <p>Speed: {busLocation.location.speed} km/h</p>
                      <p>Coordinates: {busLocation.location.lat?.toFixed(4)}, {busLocation.location.lng?.toFixed(4)}</p>
                    </div>
                  )}
                </div>
                <div style={styles.busInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Bus Number:</span>
                    <span style={styles.infoValue}>{child.bus}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Route:</span>
                    <span style={styles.infoValue}>{child.route}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Next Stop:</span>
                    <span style={styles.infoValue}>{child.stop}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'child' && (
            <div>
              <h2 style={styles.pageTitle}>Child Details</h2>
              <div style={styles.childCard}>
                <div style={styles.childHeader}>
                  <div style={styles.childAvatar}>👦</div>
                  <div>
                    <h3 style={styles.childName}>{child.name}</h3>
                    <p style={styles.childMeta}>Class {child.class} • Section {child.section}</p>
                  </div>
                </div>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailCard}>
                    <Bus size={24} color="#2563eb" />
                    <p style={styles.detailLabel}>Assigned Bus</p>
                    <p style={styles.detailValue}>{child.bus}</p>
                  </div>
                  <div style={styles.detailCard}>
                    <MapPin size={24} color="#2563eb" />
                    <p style={styles.detailLabel}>Pickup/Drop Stop</p>
                    <p style={styles.detailValue}>{child.stop}</p>
                  </div>
                  <div style={styles.detailCard}>
                    <Clock size={24} color="#2563eb" />
                    <p style={styles.detailLabel}>Route</p>
                    <p style={styles.detailValue}>{child.route}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <h2 style={styles.pageTitle}>Recent Alerts</h2>
              <div style={styles.alertsList}>
                {notifications.length > 0 ? notifications.slice(0, 5).map((notif, i) => (
                  <div key={i} style={styles.alertCard}>
                    <Bell size={24} color="#2563eb" />
                    <div style={styles.alertContent}>
                      <h4 style={styles.alertTitle}>{notif.type}</h4>
                      <p style={styles.alertText}>{notif.message}</p>
                      <span style={styles.alertTime}>{new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                )) : (
                  <div style={styles.alertCard}>
                    <Bell size={24} color="#94a3b8" />
                    <div style={styles.alertContent}>
                      <p style={styles.alertText}>No recent alerts</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h2 style={styles.pageTitle}>Today's Trip Timeline</h2>
              <div style={styles.timelineContainer}>
                {timeline.map((item, i) => (
                  <div key={i} style={styles.timelineItem}>
                    <div style={{
                      ...styles.timelineDot,
                      ...(item.status === 'completed' ? styles.timelineDotCompleted : 
                          item.status === 'in_progress' ? styles.timelineDotActive : {})
                    }}></div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <h4 style={styles.timelineTitle}>{item.stop_name}</h4>
                        <span style={styles.timelineTime}>Stop {item.sequence}</span>
                      </div>
                      <p style={styles.timelineLocation}>
                        {item.status === 'completed' ? 'Completed' : 
                         item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Driver Dashboard
function DriverDashboard({ user, token, onLogout }) {
  const [tripActive, setTripActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
    
    // Start GPS tracking when trip is active
    if (tripActive && user.bus_id) {
      const gpsInterval = setInterval(() => {
        // Simulate GPS location update
        const latitude = 28.6139 + (Math.random() - 0.5) * 0.01;
        const longitude = 77.2090 + (Math.random() - 0.5) * 0.01;
        const speed = 30 + Math.random() * 20;
        
        API.updateLocation(user.bus_id, latitude, longitude, speed, token);
      }, 10000); // Every 10 seconds
      
      return () => clearInterval(gpsInterval);
    }
  }, [tripActive, user.bus_id, token]);

  const loadStudents = async () => {
    try {
      const result = await API.getStudents(user.bus_id || 1, token);
      if (result.success) {
        setStudents(result.students);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load students:', error);
      setLoading(false);
    }
  };

  const toggleAttendance = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'boarded' ? 'pending' : 'boarded';
    
    try {
      const result = await API.markAttendance(studentId, user.bus_id || 1, newStatus, token);
      if (result.success) {
        loadStudents(); // Reload student list
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const handleEmergencyAlert = async () => {
    const description = prompt('Enter emergency description:');
    if (description) {
      try {
        await API.sendEmergencyAlert(user.user_id, user.bus_id || 1, 'Emergency', description, token);
        alert('Emergency alert sent to all parents!');
      } catch (error) {
        console.error('Failed to send alert:', error);
        alert('Failed to send emergency alert');
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.dashboard}>
      <nav style={styles.dashboardNav}>
        <div style={styles.logo}>
          <Bus size={28} color="#2563eb" />
          <span style={styles.logoText}>Driver Portal</span>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user.name}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </nav>

      <div style={styles.dashboardContent}>
        <div style={styles.driverMain}>
          <div style={styles.driverHeader}>
            <div>
              <h2 style={styles.pageTitle}>Today's Route</h2>
              <p style={styles.routeInfo}>{user.bus} • {user.route}</p>
            </div>
            <div style={styles.tripControls}>
              <button
                onClick={() => setTripActive(!tripActive)}
                style={{
                  ...styles.tripButton,
                  ...(tripActive ? styles.tripButtonStop : styles.tripButtonStart)
                }}
              >
                {tripActive ? 'End Trip' : 'Start Trip'}
              </button>
            </div>
          </div>

          <div style={styles.driverCards}>
            <div style={styles.driverCard}>
              <h3 style={styles.cardTitle}>Student Attendance</h3>
              <div style={styles.studentsList}>
                {students.map(student => (
                  <div key={student.id} style={styles.studentItem}>
                    <div style={styles.studentInfo}>
                      <div>
                        <p style={styles.studentName}>{student.name}</p>
                        <p style={styles.studentMeta}>{student.class} • {student.stop}</p>
                      </div>
                      {student.status === 'boarded' && (
                        <span style={styles.boardTime}>{student.time}</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleAttendance(student.id, student.status)}
                      style={{
                        ...styles.attendanceButton,
                        ...(student.status === 'boarded' ? styles.attendanceButtonBoarded : {})
                      }}
                    >
                      {student.status === 'boarded' ? '✓ Boarded' : 'Mark Boarded'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.driverCard}>
              <h3 style={styles.cardTitle}>Quick Actions</h3>
              <button style={styles.emergencyButton} onClick={handleEmergencyAlert}>
                <AlertTriangle size={20} />
                Send Emergency Alert
              </button>
              <div style={styles.infoBox}>
                <h4 style={styles.infoBoxTitle}>GPS Status</h4>
                <p style={styles.infoBoxText}>
                  {tripActive ? '✓ Location sharing active' : '○ Location sharing inactive'}
                </p>
                <p style={styles.infoBoxSubtext}>
                  {tripActive ? 'Updates every 10 seconds' : 'Start trip to begin tracking'}
                </p>
              </div>
              <div style={styles.infoBox}>
                <h4 style={styles.infoBoxTitle}>Driver Info</h4>
                <p style={styles.infoBoxText}>License: {user.license}</p>
                <p style={styles.infoBoxSubtext}>Experience: {user.experience}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ user, token, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  
  // Form state for adding student
  const [formData, setFormData] = useState({
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    childName: '',
    childClass: '',
    childSection: '',
    routeId: '',
    stopId: ''
  });

  useEffect(() => {
    loadDashboard();
    loadStudents();
    loadRoutes();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await API.getDashboardData(token);
      if (result.success) {
        setDashboardData(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    }
  };
  
  const loadStudents = async () => {
    try {
      const result = await API.getStudents(token);
      if (result.success) {
        setStudents(result.students);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };
  
  const loadRoutes = async () => {
    try {
      const result = await API.getRoutes(token);
      if (result.success) {
        setRoutes(result.routes);
      }
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
  };
  
  const loadStops = async (routeId) => {
    try {
      const result = await API.getStops(routeId, token);
      if (result.success) {
        setStops(result.stops);
      }
    } catch (error) {
      console.error('Failed to load stops:', error);
    }
  };
  
  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    setFormData({ ...formData, routeId, stopId: '' });
    if (routeId) {
      loadStops(routeId);
    } else {
      setStops([]);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    
    try {
      const result = await API.sendNotification(broadcastMessage, 'Parent', token);
      if (result.success) {
        alert('Notification sent to all parents!');
        setBroadcastMessage('');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };
  
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.parentName || !formData.parentEmail || !formData.childName) {
      alert('Please fill in all required fields (Parent Name, Email, Child Name)');
      return;
    }
    
    try {
      const result = await API.addStudent(formData, token);
      if (result.success) {
        alert(
          `Student added successfully!\n\n` +
          `Child ID: ${result.childId}\n` +
          `Parent ID: ${result.parentId}\n` +
          (result.defaultPassword ? `Default Password: ${result.defaultPassword}` : '')
        );
        
        // Reset form
        setFormData({
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          parentAddress: '',
          childName: '',
          childClass: '',
          childSection: '',
          routeId: '',
          stopId: ''
        });
        setShowAddStudent(false);
        
        // Reload students list
        loadStudents();
        loadDashboard();
      } else {
        alert('Failed to add student: ' + result.message);
      }
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('Failed to add student. Please try again.');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!dashboardData) {
    return <div style={styles.loading}>Failed to load dashboard data</div>;
  }

  return (
    <div style={styles.dashboard}>
      <nav style={styles.dashboardNav}>
        <div style={styles.logo}>
          <Bus size={28} color="#2563eb" />
          <span style={styles.logoText}>Admin Panel</span>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user.name}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </nav>

      <div style={styles.dashboardContent}>
        <div style={styles.sidebar}>
          <button
            style={{...styles.sidebarButton, ...(activeSection === 'overview' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveSection('overview')}
          >
            <MapPin size={20} />
            Overview
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeSection === 'students' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveSection('students')}
          >
            <Users size={20} />
            Manage Students
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeSection === 'buses' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveSection('buses')}
          >
            <Bus size={20} />
            Manage Buses
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeSection === 'drivers' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveSection('drivers')}
          >
            <Users size={20} />
            Manage Drivers
          </button>
          <button
            style={{...styles.sidebarButton, ...(activeSection === 'alerts' ? styles.sidebarButtonActive : {})}}
            onClick={() => setActiveSection('alerts')}
          >
            <Bell size={20} />
            Send Alerts
          </button>
        </div>

        <div style={styles.mainContent}>
          {activeSection === 'overview' && (
            <div>
              <h2 style={styles.pageTitle}>Dashboard Overview</h2>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <Bus size={32} color="#2563eb" />
                  </div>
                  <div>
                    <p style={styles.statLabel}>Active Buses</p>
                    <h3 style={styles.statValue}>{dashboardData.activeBuses}</h3>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <Users size={32} color="#10b981" />
                  </div>
                  <div>
                    <p style={styles.statLabel}>Online Drivers</p>
                    <h3 style={styles.statValue}>{dashboardData.onlineDrivers}</h3>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <Users size={32} color="#f59e0b" />
                  </div>
                  <div>
                    <p style={styles.statLabel}>Total Students</p>
                    <h3 style={styles.statValue}>{dashboardData.totalStudents}</h3>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <CheckCircle size={32} color="#8b5cf6" />
                  </div>
                  <div>
                    <p style={styles.statLabel}>Trips Today</p>
                    <h3 style={styles.statValue}>{dashboardData.tripsCompleted}</h3>
                  </div>
                </div>
              </div>

              <div style={styles.adminCard}>
                <h3 style={styles.cardTitle}>Fleet Status</h3>
                <div style={styles.busTable}>
                  {dashboardData.buses.map(bus => (
                    <div key={bus.id} style={styles.busRow}>
                      <div style={styles.busInfo}>
                        <span style={styles.busNumber}>{bus.number}</span>
                        <span style={styles.busDriver}>{bus.driver}</span>
                      </div>
                      <div style={styles.busDetails}>
                        <span style={styles.busRoute}>{bus.route}</span>
                        <span style={styles.busStudents}>{bus.students} students</span>
                      </div>
                      <span style={{
                        ...styles.busStatus,
                        ...(bus.status === 'Active' ? styles.busStatusActive : styles.busStatusCompleted)
                      }}>
                        {bus.status === 'Active' ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'students' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={styles.pageTitle}>Manage Students</h2>
                <button 
                  style={styles.addButton}
                  onClick={() => setShowAddStudent(!showAddStudent)}
                >
                  {showAddStudent ? '✕ Cancel' : '+ Add New Student'}
                </button>
              </div>
              
              {showAddStudent && (
                <div style={styles.adminCard}>
                  <h3 style={styles.cardTitle}>Add New Student</h3>
                  <form onSubmit={handleAddStudent} style={styles.studentForm}>
                    <div style={styles.formSection}>
                      <h4 style={styles.formSectionTitle}>Parent Information</h4>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Parent Name *</label>
                          <input
                            type="text"
                            value={formData.parentName}
                            onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                            style={styles.formInput}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Parent Phone</label>
                          <input
                            type="tel"
                            value={formData.parentPhone}
                            onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                            style={styles.formInput}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Parent Email *</label>
                          <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                            style={styles.formInput}
                            placeholder="parent@email.com"
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Address</label>
                          <input
                            type="text"
                            value={formData.parentAddress}
                            onChange={(e) => setFormData({...formData, parentAddress: e.target.value})}
                            style={styles.formInput}
                            placeholder="123 Main Street, City"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.formSection}>
                      <h4 style={styles.formSectionTitle}>Student Information</h4>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Student Name *</label>
                          <input
                            type="text"
                            value={formData.childName}
                            onChange={(e) => setFormData({...formData, childName: e.target.value})}
                            style={styles.formInput}
                            placeholder="Jane Doe"
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Class</label>
                          <input
                            type="text"
                            value={formData.childClass}
                            onChange={(e) => setFormData({...formData, childClass: e.target.value})}
                            style={styles.formInput}
                            placeholder="5"
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Section</label>
                          <input
                            type="text"
                            value={formData.childSection}
                            onChange={(e) => setFormData({...formData, childSection: e.target.value})}
                            style={styles.formInput}
                            placeholder="A"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.formSection}>
                      <h4 style={styles.formSectionTitle}>Route Assignment (Optional)</h4>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Route</label>
                          <select
                            value={formData.routeId}
                            onChange={handleRouteChange}
                            style={styles.formSelect}
                          >
                            <option value="">Select Route</option>
                            {routes.map(route => (
                              <option key={route.id} value={route.id}>
                                {route.name} ({route.bus})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Stop</label>
                          <select
                            value={formData.stopId}
                            onChange={(e) => setFormData({...formData, stopId: e.target.value})}
                            style={styles.formSelect}
                            disabled={!formData.routeId}
                          >
                            <option value="">Select Stop</option>
                            {stops.map(stop => (
                              <option key={stop.id} value={stop.id}>
                                {stop.name} (Stop {stop.sequence})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <button type="submit" style={styles.submitButton}>
                      Add Student to Database
                    </button>
                  </form>
                </div>
              )}
              
              <div style={styles.adminCard}>
                <h3 style={styles.cardTitle}>All Students ({students.length})</h3>
                <div style={styles.studentTable}>
                  {students.map(student => (
                    <div key={student.id} style={styles.studentRow}>
                      <div style={styles.studentMainInfo}>
                        <div>
                          <span style={styles.studentName}>{student.name}</span>
                          <span style={styles.studentClass}>Class {student.class}-{student.section}</span>
                        </div>
                        <div style={styles.studentParentInfo}>
                          <span style={styles.parentLabel}>Parent:</span>
                          <span style={styles.parentName}>{student.parentName}</span>
                          <span style={styles.parentContact}>{student.parentEmail}</span>
                        </div>
                      </div>
                      <div style={styles.studentRouteInfo}>
                        <div style={styles.routeDetail}>
                          <Bus size={16} color="#64748b" />
                          <span>{student.bus}</span>
                        </div>
                        <div style={styles.routeDetail}>
                          <MapPin size={16} color="#64748b" />
                          <span>{student.stop}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'buses' && (
            <div>
              <h2 style={styles.pageTitle}>Manage Buses</h2>
              <button style={styles.addButton}>+ Add New Bus</button>
              <div style={styles.adminCard}>
                <h3 style={styles.cardTitle}>Bus Fleet</h3>
                <div style={styles.busTable}>
                  {dashboardData.buses.map(bus => (
                    <div key={bus.id} style={styles.busRow}>
                      <div style={styles.busInfo}>
                        <span style={styles.busNumber}>{bus.number}</span>
                        <span style={styles.busDriver}>Driver: {bus.driver}</span>
                      </div>
                      <div style={styles.busDetails}>
                        <span style={styles.busRoute}>Route: {bus.route}</span>
                        <span style={styles.busStudents}>Capacity: {bus.students} students</span>
                      </div>
                      <button style={styles.editButton}>Edit</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'drivers' && (
            <div>
              <h2 style={styles.pageTitle}>Manage Drivers</h2>
              <button style={styles.addButton}>+ Add New Driver</button>
              <div style={styles.adminCard}>
                <p style={styles.placeholderText}>Driver Management</p>
                <p style={styles.placeholderSubtext}>Add, edit, or remove driver accounts and assign buses</p>
              </div>
            </div>
          )}

          {activeSection === 'alerts' && (
            <div>
              <h2 style={styles.pageTitle}>Send Notifications</h2>
              <div style={styles.adminCard}>
                <h3 style={styles.cardTitle}>Broadcast Alert to All Parents</h3>
                <textarea
                  placeholder="Type your message here..."
                  style={styles.messageInput}
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
                <div style={styles.alertButtons}>
                  <button style={styles.sendButton} onClick={handleSendBroadcast}>
                    Send to All Parents
                  </button>
                  <button style={{...styles.sendButton, ...styles.sendButtonSecondary}}>
                    Send to Specific Route
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  
  // Landing Page
  landing: { minHeight: '100vh' },
  landingNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoText: { fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  navButtons: { display: 'flex', gap: '15px' },
  navButton: { padding: '10px 20px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '500', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s', fontSize: '15px' },
  navButtonPrimary: { background: '#2563eb', color: 'white' },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 60px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  heroContent: { maxWidth: '600px' },
  heroTitle: { fontSize: '48px', fontWeight: '800', marginBottom: '20px', lineHeight: '1.2' },
  heroSubtitle: { fontSize: '20px', marginBottom: '30px', opacity: '0.95', lineHeight: '1.6' },
  heroButtons: { display: 'flex', gap: '15px' },
  heroPrimaryBtn: { padding: '15px 35px', background: 'white', color: '#667eea', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  heroSecondaryBtn: { padding: '15px 35px', background: 'transparent', color: 'white', border: '2px solid white', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  heroImage: { position: 'relative', width: '400px', height: '400px' },
  floatingCard: { background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' },
  floatingCardText: { marginTop: '15px', color: '#1e293b', fontSize: '18px', fontWeight: '600' },
  features: { padding: '80px 60px', background: 'white' },
  sectionTitle: { fontSize: '36px', fontWeight: '700', textAlign: 'center', marginBottom: '60px', color: '#1e293b' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' },
  featureCard: { padding: '30px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' },
  featureIcon: { marginBottom: '20px' },
  featureTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '15px', color: '#1e293b' },
  featureList: { listStyle: 'none', padding: 0, margin: 0 },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#475569', fontSize: '15px' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', padding: '80px 60px', background: '#f8fafc' },
  statCard: { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  statNumber: { fontSize: '42px', fontWeight: '800', color: '#2563eb', marginBottom: '10px' },
  statLabel: { fontSize: '16px', color: '#64748b', fontWeight: '500' },
  footer: { background: '#1e293b', color: 'white', padding: '40px 60px', textAlign: 'center' },
  footerLinks: { marginTop: '15px', color: '#94a3b8', fontSize: '14px' },
  
  // Login
  loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' },
  loginContainer: { background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  loginHeader: { textAlign: 'center', marginBottom: '30px' },
  loginTitle: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginTop: '15px', marginBottom: '8px' },
  loginSubtitle: { color: '#64748b', fontSize: '15px' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  toggleContainer: { display: 'flex', gap: '10px', marginBottom: '10px' },
  toggleBtn: { flex: 1, padding: '12px', border: '2px solid #e2e8f0', background: 'white', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500', color: '#64748b', transition: 'all 0.2s' },
  toggleBtnActive: { background: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#475569' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#1e293b' },
  eyeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' },
  otpInput: { width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '24px', fontWeight: '600', textAlign: 'center', letterSpacing: '8px' },
  errorBox: { padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '14px' },
  demoCredentials: { padding: '15px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' },
  demoTitle: { fontSize: '13px', fontWeight: '600', color: '#0c4a6e', marginBottom: '8px' },
  demoText: { fontSize: '13px', color: '#075985', margin: '4px 0' },
  submitButton: { padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  otpInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f0f9ff', borderRadius: '8px' },
  otpText: { fontSize: '14px', color: '#075985', fontWeight: '500' },
  changeButton: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  resendButton: { padding: '12px', background: 'transparent', color: '#2563eb', border: '2px solid #2563eb', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  backButton: { width: '100%', padding: '12px', marginTop: '20px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  
  // Dashboard
  dashboard: { minHeight: '100vh', background: '#f8fafc' },
  dashboardNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  userName: { fontSize: '15px', fontWeight: '600', color: '#475569' },
  logoutButton: { padding: '8px 20px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  dashboardContent: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  sidebar: { width: '250px', background: 'white', padding: '20px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' },
  sidebarButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', color: '#64748b', textAlign: 'left' },
  sidebarButtonActive: { background: '#eff6ff', color: '#2563eb' },
  mainContent: { flex: 1, padding: '40px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '25px' },
  
  // Tracking
  trackingCard: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  statusBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: '#dbeafe', borderRadius: '25px', fontSize: '15px', fontWeight: '600', color: '#1e40af' },
  statusDot: { width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' },
  etaText: { fontSize: '18px', fontWeight: '700', color: '#2563eb' },
  mapContainer: { background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)', borderRadius: '12px', padding: '60px', textAlign: 'center', marginBottom: '20px' },
  mapText: { fontSize: '18px', fontWeight: '600', color: '#1e40af', marginTop: '15px' },
  mapSubtext: { fontSize: '14px', color: '#64748b', marginTop: '8px' },
  locationInfo: { marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', fontSize: '13px', color: '#475569' },
  busInfo: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  infoItem: { padding: '15px', background: '#f8fafc', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  infoLabel: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: '15px', color: '#1e293b', fontWeight: '600' },
  
  // Child
  childCard: { background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  childHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px solid #e2e8f0' },
  childAvatar: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' },
  childName: { fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' },
  childMeta: { fontSize: '15px', color: '#64748b' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  detailCard: { padding: '25px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' },
  detailLabel: { fontSize: '14px', color: '#64748b', marginTop: '12px', marginBottom: '8px' },
  detailValue: { fontSize: '16px', fontWeight: '600', color: '#1e293b' },
  
  // Alerts
  alertsList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  alertCard: { background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' },
  alertText: { fontSize: '14px', color: '#64748b', marginBottom: '8px' },
  alertTime: { fontSize: '13px', color: '#94a3b8' },
  
  // Timeline
  timelineContainer: { background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  timelineItem: { display: 'flex', gap: '20px', position: 'relative', paddingBottom: '25px' },
  timelineDot: { width: '16px', height: '16px', borderRadius: '50%', background: '#e2e8f0', border: '3px solid white', boxShadow: '0 0 0 2px #e2e8f0', flexShrink: 0, marginTop: '4px' },
  timelineDotCompleted: { background: '#10b981', boxShadow: '0 0 0 2px #10b981' },
  timelineDotActive: { background: '#2563eb', boxShadow: '0 0 0 2px #2563eb' },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  timelineTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b' },
  timelineTime: { fontSize: '14px', color: '#64748b', fontWeight: '500' },
  timelineLocation: { fontSize: '14px', color: '#94a3b8' },
  
  // Driver
  driverMain: { width: '100%' },
  driverHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' },
  routeInfo: { fontSize: '15px', color: '#64748b', marginTop: '8px' },
  tripControls: { display: 'flex', gap: '15px' },
  tripButton: { padding: '14px 30px', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  tripButtonStart: { background: '#10b981', color: 'white' },
  tripButtonStop: { background: '#ef4444', color: 'white' },
  driverCards: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' },
  driverCard: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' },
  studentsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  studentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '10px' },
  studentInfo: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' },
  studentMeta: { fontSize: '13px', color: '#64748b' },
  boardTime: { fontSize: '13px', color: '#10b981', fontWeight: '600' },
  attendanceButton: { padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginLeft: '15px' },
  attendanceButtonBoarded: { background: '#10b981' },
  emergencyButton: { width: '100%', padding: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  infoBox: { padding: '15px', background: '#f0f9ff', borderRadius: '10px', marginBottom: '15px' },
  infoBoxTitle: { fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '8px' },
  infoBoxText: { fontSize: '14px', color: '#075985', marginBottom: '4px' },
  infoBoxSubtext: { fontSize: '13px', color: '#0369a1' },
  
  // Admin
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
  statIcon: { marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#1e293b' },
  adminCard: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  busTable: { display: 'flex', flexDirection: 'column', gap: '12px' },
  busRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: '#f8fafc', borderRadius: '10px' },
  busNumber: { fontSize: '15px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '4px' },
  busDriver: { fontSize: '13px', color: '#64748b' },
  busDetails: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  busRoute: { fontSize: '14px', color: '#475569', marginBottom: '4px' },
  busStudents: { fontSize: '13px', color: '#94a3b8' },
  busStatus: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  busStatusActive: { background: '#dcfce7', color: '#166534' },
  busStatusCompleted: { background: '#e0e7ff', color: '#3730a3' },
  addButton: { padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' },
  editButton: { padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  placeholderText: { fontSize: '18px', fontWeight: '600', color: '#64748b', textAlign: 'center', marginTop: '40px' },
  placeholderSubtext: { fontSize: '14px', color: '#94a3b8', textAlign: 'center', marginTop: '10px', marginBottom: '40px' },
  messageInput: { width: '100%', padding: '15px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', marginBottom: '15px', resize: 'vertical', boxSizing: 'border-box' },
  alertButtons: { display: 'flex', gap: '15px' },
  sendButton: { flex: 1, padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  sendButtonSecondary: { background: '#64748b' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '18px', color: '#64748b' },
  
  // Student Management Styles
  studentForm: { display: 'flex', flexDirection: 'column', gap: '25px' },
  formSection: { borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
  formSectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '15px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  formLabel: { fontSize: '14px', fontWeight: '600', color: '#475569' },
  formInput: { padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
  formSelect: { padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', background: 'white', cursor: 'pointer' },
  studentTable: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  studentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' },
  studentMainInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  studentName: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginRight: '12px' },
  studentClass: { fontSize: '13px', color: '#64748b', background: '#e0e7ff', padding: '4px 10px', borderRadius: '12px', display: 'inline-block' },
  studentParentInfo: { display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#64748b' },
  parentLabel: { fontWeight: '600' },
  parentName: { color: '#475569' },
  parentContact: { color: '#94a3b8', fontSize: '13px' },
  studentRouteInfo: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
  routeDetail: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' },
};