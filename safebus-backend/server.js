// ==========================================
// BACKEND API - server.js
// Node.js + Express + Oracle Database
// ==========================================

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// DATABASE CONNECTION CONFIGURATION
// ==========================================
const dbConfig = {
  user: process.env.DB_USER || 'schooladmin',
  password: process.env.DB_PASSWORD || 'schooladmin123', // CHANGE THIS
  connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XEPDB1'
};

// Initialize Oracle Client
try {
  oracledb.initOracleClient({ 
    libDir: process.env.ORACLE_CLIENT_PATH || 'C:\oracle\instantclient_21_9\instantclient-sqlplus-windows.x64-23.26.0.0.0\instantclient_23_0' 
  });
  console.log('✅ Oracle Client initialized');
} catch (err) {
  console.error('❌ Oracle Client initialization failed:', err.message);
}

// OTP Storage (In production, use Redis or database)
const otpStore = new Map();

// JWT Secret (In production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// ==========================================
// EMAIL CONFIGURATION (for OTP)
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 's7nexttechnologies@gmail.com', // CHANGE THIS
    pass: 'huug hfga imei bcyf' // CHANGE THIS - Use App Password
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Get database connection
async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: 'your_email@gmail.com',
    to: email,
    subject: 'SafeBus Track - Login OTP',
    html: `
      <h2>Your Login OTP</h2>
      <p>Your OTP for login is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 5 minutes.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Send OTP via SMS (Using Twilio or any SMS provider)
async function sendOTPSMS(phone, otp) {
  // Implement SMS sending using Twilio, AWS SNS, or other SMS provider
  console.log(`SMS OTP to ${phone}: ${otp}`);
  // For demo, just log it
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// 1. Generate OTP
app.post('/api/auth/generate-otp', async (req, res) => {
  try {
    const { contact, contactType } = req.body;
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiry (5 minutes)
    otpStore.set(contact, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // Send OTP
    if (contactType === 'email') {
      await sendOTPEmail(contact, otp);
    } else {
      await sendOTPSMS(contact, otp);
    }
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// 2. Verify OTP and Login
app.post('/api/auth/login', async (req, res) => {
  let connection;
  
  try {
    const { contact, password, otp, userType } = req.body;
    
    // Verify OTP
    const storedOTP = otpStore.get(contact);
    if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Clear OTP after verification
    otpStore.delete(contact);
    
    // Get database connection
    connection = await getConnection();
    
    // Query user
    const result = await connection.execute(
      `SELECT user_id, name, phone, email, password_hash, role, status 
       FROM Users 
       WHERE (email = :contact OR phone = :contact) AND role = :role`,
      { 
        contact, 
        role: userType.charAt(0).toUpperCase() + userType.slice(1) 
      }
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const user = {
      user_id: result.rows[0][0],
      name: result.rows[0][1],
      phone: result.rows[0][2],
      email: result.rows[0][3],
      password_hash: result.rows[0][4],
      role: result.rows[0][5],
      status: result.rows[0][6]
    };
    
    // Verify password (in production, use bcrypt.compare)
    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    // Get additional user data based on role
    let userData = { type: userType, ...user };
    
    if (userType === 'parent') {
      // Get parent details and children
      const parentResult = await connection.execute(
        `SELECT p.address, p.profile_photo,
                c.child_id, c.name as child_name, c.class, c.section, c.photo,
                b.bus_number, r.route_name, s.stop_name
         FROM Parent p
         LEFT JOIN Child c ON p.parent_id = c.parent_id
         LEFT JOIN Student_Route_Assignment sra ON c.child_id = sra.child_id
         LEFT JOIN Route r ON sra.route_id = r.route_id
         LEFT JOIN Bus b ON r.bus_id = b.bus_id
         LEFT JOIN Stops s ON sra.stop_id = s.stop_id
         WHERE p.parent_id = :userId`,
        { userId: user.user_id }
      );
      
      if (parentResult.rows.length > 0) {
        userData.address = parentResult.rows[0][0];
        userData.children = parentResult.rows.map(row => ({
          id: row[2],
          name: row[3],
          class: row[4],
          section: row[5],
          photo: row[6],
          bus: row[7],
          route: row[8],
          stop: row[9]
        }));
      }
    } else if (userType === 'driver') {
      // Get driver details
      const driverResult = await connection.execute(
        `SELECT d.license_number, d.experience_years, d.photo,
                b.bus_id, b.bus_number, r.route_name
         FROM Driver d
         LEFT JOIN Bus b ON d.driver_id = b.driver_id
         LEFT JOIN Route r ON b.bus_id = r.bus_id
         WHERE d.driver_id = :userId`,
        { userId: user.user_id }
      );
      
      if (driverResult.rows.length > 0) {
        userData.license = driverResult.rows[0][0];
        userData.experience = `${driverResult.rows[0][1]} years`;
        userData.bus_id = driverResult.rows[0][3];
        userData.bus = driverResult.rows[0][4];
        userData.route = driverResult.rows[0][5];
      }
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ success: true, token, user: userData });
    
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// ==========================================
// MIDDLEWARE - JWT Verification
// ==========================================
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// PARENT ENDPOINTS
// ==========================================

// Get bus location
app.get('/api/parent/bus-location/:busId', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT latitude, longitude, speed, timestamp
       FROM (
         SELECT latitude, longitude, speed, timestamp
         FROM Bus_Location
         WHERE bus_id = :busId
         ORDER BY timestamp DESC
       )
       WHERE ROWNUM = 1`,
      { busId: req.params.busId }
    );
    
    if (result.rows.length > 0) {
      const location = {
        lat: result.rows[0][0],
        lng: result.rows[0][1],
        speed: result.rows[0][2],
        timestamp: result.rows[0][3]
      };
      
      // Calculate ETA (simplified - in production use proper routing)
      const eta = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
      
      res.json({ success: true, location, eta, status: 'en_route' });
    } else {
      res.json({ success: false, message: 'Location not found' });
    }
    
  } catch (error) {
    console.error('Get Location Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get location' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Get trip timeline
app.get('/api/parent/trip-timeline/:routeId', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT s.stop_name, s.sequence_number, s.latitude, s.longitude
       FROM Stops s
       WHERE s.route_id = :routeId
       ORDER BY s.sequence_number`,
      { routeId: req.params.routeId }
    );
    
    const timeline = result.rows.map((row, index) => ({
      stop_name: row[0],
      sequence: row[1],
      status: index === 0 ? 'completed' : index === 2 ? 'in_progress' : 'pending'
    }));
    
    res.json({ success: true, timeline });
    
  } catch (error) {
    console.error('Get Timeline Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get timeline' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Get notifications
app.get('/api/parent/notifications', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT notification_id, type, message, is_read, timestamp
       FROM Notifications
       WHERE user_id = :userId
       ORDER BY timestamp DESC`,
      { userId: req.user.userId }
    );
    
    const notifications = result.rows.map(row => ({
      id: row[0],
      type: row[1],
      message: row[2],
      is_read: row[3] === 'Y',
      timestamp: row[4]
    }));
    
    res.json({ success: true, notifications });
    
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// ==========================================
// DRIVER ENDPOINTS
// ==========================================

// Get students for driver's route
app.get('/api/driver/students/:busId', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT c.child_id, c.name, c.class, s.stop_name,
              a.status, a.timestamp
       FROM Child c
       JOIN Student_Route_Assignment sra ON c.child_id = sra.child_id
       JOIN Route r ON sra.route_id = r.route_id
       JOIN Stops s ON sra.stop_id = s.stop_id
       LEFT JOIN Attendance a ON c.child_id = a.child_id 
         AND a.bus_id = :busId
         AND TRUNC(a.attendance_date) = TRUNC(SYSDATE)
       WHERE r.bus_id = :busId
       ORDER BY s.sequence_number`,
      { busId: req.params.busId }
    );
    
    const students = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      class: row[2],
      stop: row[3],
      status: row[4] ? row[4].toLowerCase() : 'pending',
      time: row[5] ? new Date(row[5]).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '-'
    }));
    
    res.json({ success: true, students });
    
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get students' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Mark student attendance
app.post('/api/driver/attendance', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    const { childId, busId, status } = req.body;
    
    connection = await getConnection();
    
    // Get next attendance_id
    const idResult = await connection.execute(
      `SELECT NVL(MAX(attendance_id), 0) + 1 FROM Attendance`
    );
    const nextId = idResult.rows[0][0];
    
    // Insert or update attendance
    await connection.execute(
      `MERGE INTO Attendance a
       USING (SELECT :childId as child_id, :busId as bus_id FROM dual) src
       ON (a.child_id = src.child_id 
           AND a.bus_id = src.bus_id 
           AND TRUNC(a.attendance_date) = TRUNC(SYSDATE))
       WHEN MATCHED THEN
         UPDATE SET a.status = :status, a.timestamp = SYSDATE
       WHEN NOT MATCHED THEN
         INSERT (attendance_id, child_id, bus_id, attendance_date, status, timestamp)
         VALUES (:attendanceId, :childId, :busId, SYSDATE, :status, SYSDATE)`,
      { 
        childId, 
        busId, 
        status: status.charAt(0).toUpperCase() + status.slice(1),
        attendanceId: nextId
      },
      { autoCommit: true }
    );
    
    res.json({ success: true, message: 'Attendance marked' });
    
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Update bus location (called periodically by driver app)
app.post('/api/driver/update-location', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    const { busId, latitude, longitude, speed } = req.body;
    
    connection = await getConnection();
    
    // Get next location_id
    const idResult = await connection.execute(
      `SELECT NVL(MAX(location_id), 0) + 1 FROM Bus_Location`
    );
    const nextId = idResult.rows[0][0];
    
    // Insert new location
    await connection.execute(
      `INSERT INTO Bus_Location (location_id, bus_id, latitude, longitude, speed, timestamp)
       VALUES (:locationId, :busId, :latitude, :longitude, :speed, SYSDATE)`,
      { locationId: nextId, busId, latitude, longitude, speed },
      { autoCommit: true }
    );
    
    res.json({ success: true, message: 'Location updated' });
    
  } catch (error) {
    console.error('Update Location Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Send emergency alert
app.post('/api/driver/emergency-alert', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    const { driverId, busId, type, description } = req.body;
    
    connection = await getConnection();
    
    // Get next incident_id
    const idResult = await connection.execute(
      `SELECT NVL(MAX(incident_id), 0) + 1 FROM Incident_Reports`
    );
    const nextId = idResult.rows[0][0];
    
    // Insert incident report
    await connection.execute(
      `INSERT INTO Incident_Reports (incident_id, driver_id, bus_id, type, description, timestamp)
       VALUES (:incidentId, :driverId, :busId, :type, :description, SYSDATE)`,
      { incidentId: nextId, driverId, busId, type, description },
      { autoCommit: true }
    );
    
    // Create notifications for all parents on this bus route
    const parentsResult = await connection.execute(
      `SELECT DISTINCT p.parent_id
       FROM Parent p
       JOIN Child c ON p.parent_id = c.parent_id
       JOIN Student_Route_Assignment sra ON c.child_id = sra.child_id
       JOIN Route r ON sra.route_id = r.route_id
       WHERE r.bus_id = :busId`,
      { busId }
    );
    
    for (const row of parentsResult.rows) {
      const notifIdResult = await connection.execute(
        `SELECT NVL(MAX(notification_id), 0) + 1 FROM Notifications`
      );
      const notifId = notifIdResult.rows[0][0];
      
      await connection.execute(
        `INSERT INTO Notifications (notification_id, user_id, type, message, is_read, timestamp)
         VALUES (:notifId, :userId, :type, :message, 'N', SYSDATE)`,
        { 
          notifId, 
          userId: row[0], 
          type: 'Emergency',
          message: `Emergency Alert: ${description}`
        },
        { autoCommit: true }
      );
    }
    
    res.json({ success: true, message: 'Emergency alert sent' });
    
  } catch (error) {
    console.error('Emergency Alert Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send alert' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Get dashboard statistics
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    // Get active buses count
    const busesResult = await connection.execute(
      `SELECT COUNT(*) FROM Bus WHERE status = 'Active'`
    );
    
    // Get online drivers count
    const driversResult = await connection.execute(
      `SELECT COUNT(*) FROM Driver`
    );
    
    // Get total students count
    const studentsResult = await connection.execute(
      `SELECT COUNT(*) FROM Child`
    );
    
    // Get trips completed today
    const tripsResult = await connection.execute(
      `SELECT COUNT(DISTINCT bus_id) 
       FROM Attendance 
       WHERE TRUNC(attendance_date) = TRUNC(SYSDATE)`
    );
    
    // Get bus details
    const busDetailsResult = await connection.execute(
      `SELECT b.bus_id, b.bus_number, u.name as driver_name, 
              r.route_name, b.status,
              (SELECT COUNT(*) FROM Student_Route_Assignment sra 
               JOIN Route r2 ON sra.route_id = r2.route_id 
               WHERE r2.bus_id = b.bus_id) as student_count
       FROM Bus b
       LEFT JOIN Driver d ON b.driver_id = d.driver_id
       LEFT JOIN Users u ON d.driver_id = u.user_id
       LEFT JOIN Route r ON b.bus_id = r.bus_id
       ORDER BY b.bus_id`
    );
    
    const buses = busDetailsResult.rows.map(row => ({
      id: row[0],
      number: row[1],
      driver: row[2] || 'Not Assigned',
      route: row[3] || 'No Route',
      status: row[4] || 'inactive',
      students: row[5] || 0
    }));
    
    res.json({
      success: true,
      data: {
        activeBuses: busesResult.rows[0][0],
        onlineDrivers: driversResult.rows[0][0],
        totalStudents: studentsResult.rows[0][0],
        tripsCompleted: tripsResult.rows[0][0],
        buses
      }
    });
    
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard data' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Send broadcast notification
app.post('/api/admin/send-notification', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    const { message, targetRole } = req.body;
    
    connection = await getConnection();
    
    // Get users based on target role
    const usersResult = await connection.execute(
      `SELECT user_id FROM Users WHERE role = :role`,
      { role: targetRole || 'Parent' }
    );
    
    // Create notifications for all users
    for (const row of usersResult.rows) {
      const notifIdResult = await connection.execute(
        `SELECT NVL(MAX(notification_id), 0) + 1 FROM Notifications`
      );
      const notifId = notifIdResult.rows[0][0];
      
      await connection.execute(
        `INSERT INTO Notifications (notification_id, user_id, type, message, is_read, timestamp)
         VALUES (:notifId, :userId, 'Broadcast', :message, 'N', SYSDATE)`,
        { notifId, userId: row[0], message },
        { autoCommit: true }
      );
    }
    
    res.json({ success: true, message: 'Notification sent to all users' });
    
  } catch (error) {
    console.error('Send Notification Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Add new student
app.post('/api/admin/add-student', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    const { 
      parentName, 
      parentPhone, 
      parentEmail, 
      parentAddress,
      childName, 
      childClass, 
      childSection,
      routeId,
      stopId 
    } = req.body;
    
    connection = await getConnection();
    
    // Start transaction
    
    // 1. Check if parent exists by email
    let parentId;
    const parentCheck = await connection.execute(
      `SELECT user_id FROM Users WHERE email = :email AND role = 'Parent'`,
      { email: parentEmail }
    );
    
    if (parentCheck.rows.length > 0) {
      // Parent exists
      parentId = parentCheck.rows[0][0];
    } else {
      // Create new parent user
      const userIdResult = await connection.execute(
        `SELECT NVL(MAX(user_id), 0) + 1 FROM Users`
      );
      parentId = userIdResult.rows[0][0];
      
      // Generate default password (parent can change later)
      const defaultPassword = 'parent123';
      
      await connection.execute(
        `INSERT INTO Users (user_id, name, phone, email, password_hash, role, status)
         VALUES (:userId, :name, :phone, :email, :password, 'Parent', 'Active')`,
        { 
          userId: parentId, 
          name: parentName, 
          phone: parentPhone, 
          email: parentEmail,
          password: defaultPassword
        },
        { autoCommit: false }
      );
      
      // Insert into Parent table
      await connection.execute(
        `INSERT INTO Parent (parent_id, address, profile_photo)
         VALUES (:parentId, :address, NULL)`,
        { parentId, address: parentAddress },
        { autoCommit: false }
      );
    }
    
    // 2. Create child
    const childIdResult = await connection.execute(
      `SELECT NVL(MAX(child_id), 0) + 1 FROM Child`
    );
    const childId = childIdResult.rows[0][0];
    
    await connection.execute(
      `INSERT INTO Child (child_id, name, parent_id, class, section, photo)
       VALUES (:childId, :name, :parentId, :class, :section, NULL)`,
      { 
        childId, 
        name: childName, 
        parentId, 
        class: childClass, 
        section: childSection 
      },
      { autoCommit: false }
    );
    
    // 3. Assign to route and stop
    if (routeId && stopId) {
      const assignmentIdResult = await connection.execute(
        `SELECT NVL(MAX(id), 0) + 1 FROM Student_Route_Assignment`
      );
      const assignmentId = assignmentIdResult.rows[0][0];
      
      await connection.execute(
        `INSERT INTO Student_Route_Assignment (id, child_id, route_id, stop_id)
         VALUES (:id, :childId, :routeId, :stopId)`,
        { id: assignmentId, childId, routeId, stopId },
        { autoCommit: false }
      );
    }
    
    // Commit transaction
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Student added successfully',
      childId,
      parentId,
      defaultPassword: parentCheck.rows.length === 0 ? 'parent123' : null
    });
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Add Student Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add student: ' + error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Get all routes for dropdown
app.get('/api/admin/routes', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT r.route_id, r.route_name, b.bus_number
       FROM Route r
       LEFT JOIN Bus b ON r.bus_id = b.bus_id
       ORDER BY r.route_name`
    );
    
    const routes = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      bus: row[2]
    }));
    
    res.json({ success: true, routes });
    
  } catch (error) {
    console.error('Get Routes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get routes' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Get stops for a specific route
app.get('/api/admin/stops/:routeId', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT stop_id, stop_name, sequence_number
       FROM Stops
       WHERE route_id = :routeId
       ORDER BY sequence_number`,
      { routeId: req.params.routeId }
    );
    
    const stops = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      sequence: row[2]
    }));
    
    res.json({ success: true, stops });
    
  } catch (error) {
    console.error('Get Stops Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stops' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Get all students (for admin to view)
app.get('/api/admin/students', authenticateToken, async (req, res) => {
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT c.child_id, c.name, c.class, c.section,
              u.name as parent_name, u.phone as parent_phone, u.email as parent_email,
              r.route_name, s.stop_name, b.bus_number
       FROM Child c
       JOIN Parent p ON c.parent_id = p.parent_id
       JOIN Users u ON p.parent_id = u.user_id
       LEFT JOIN Student_Route_Assignment sra ON c.child_id = sra.child_id
       LEFT JOIN Route r ON sra.route_id = r.route_id
       LEFT JOIN Stops s ON sra.stop_id = s.stop_id
       LEFT JOIN Bus b ON r.bus_id = b.bus_id
       ORDER BY c.name`
    );
    
    const students = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      class: row[2],
      section: row[3],
      parentName: row[4],
      parentPhone: row[5],
      parentEmail: row[6],
      route: row[7] || 'Not Assigned',
      stop: row[8] || 'Not Assigned',
      bus: row[9] || 'Not Assigned'
    }));
    
    res.json({ success: true, students });
    
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get students' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Database: Oracle`);
  console.log(`🚀 API Ready!`);
});

// ==========================================
// PACKAGE.JSON DEPENDENCIES
// ==========================================
/*
{
  "name": "safebus-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "oracledb": "^6.0.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
*/