import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <header className="header">
        <h1>🚌 KidRideGuard</h1>
        <p>Smart School Bus Tracking & Student Safety Platform</p>
      </header>

      <nav className="nav">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("parent")}>Parent App</button>
        <button onClick={() => setPage("driver")}>Driver App</button>
        <button onClick={() => setPage("admin")}>Admin Panel</button>
      </nav>

      {page === "home" && <Home />}
      {page === "parent" && <Parent />}
      {page === "driver" && <Driver />}
      {page === "admin" && <Admin />}

      <footer className="footer">
        © 2025 SafeBus – MVP Demo
      </footer>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home() {
  return (
    <section className="section">
      <Card title="Why SafeBus?">
        SafeBus ensures real-time visibility of school buses, student safety,
        and peace of mind for parents.
      </Card>

      <Card title="How It Works">
        <ul>
          <li>📱 Parents track buses live & receive alerts</li>
          <li>🧑‍✈️ Drivers share GPS & mark attendance</li>
          <li>🧑‍💼 Admins manage buses, routes & emergencies</li>
        </ul>
      </Card>

      <Card title="MVP Features">
        Live tracking • ETA • Alerts • Attendance • Admin dashboard
      </Card>
    </section>
  );
}

/* ---------------- PARENT ---------------- */
function Parent() {
  return (
    <section className="section">
      <Card title="Parent Login">
        <input placeholder="Mobile / Email" />
        <br /><br />
        <button className="primary">Login</button>
      </Card>

      <Card title="Child Details">
        <p><b>Name:</b> Aarav Sharma</p>
        <p><b>Class:</b> 5-A</p>
        <p><b>Bus:</b> Bus 12 – Route North</p>
        <p><b>Stop:</b> Green Park</p>
      </Card>

      <Card title="Live Bus Tracking">
        <p>Status: <span className="status">Bus En Route</span></p>
        <p>ETA: 12 minutes</p>
        <div className="map">MAP PLACEHOLDER</div>
      </Card>

      <Card title="Alerts">
        <div className="alert">🚍 Bus is approaching your stop</div>
        <div className="alert">🚶 Child boarded the bus</div>
        <div className="alert">🏫 Child reached school</div>
      </Card>

      <Card title="Trip Timeline">
        <p>08:05 – Trip Started</p>
        <p>08:20 – Green Park Stop</p>
        <p>08:45 – Reached School</p>
      </Card>
    </section>
  );
}

/* ---------------- DRIVER ---------------- */
function Driver() {
  return (
    <section className="section">
      <Card title="Driver Login">
        <input placeholder="Mobile / PIN" />
        <br /><br />
        <button className="primary">Login</button>
      </Card>

      <Card title="Trip Control">
        <button className="primary">Start Trip</button>
        <button className="primary gray">End Trip</button>
      </Card>

      <Card title="Student Attendance">
        <p>Aarav – ✅ Boarded</p>
        <p>Riya – ❌ Not Boarded</p>
      </Card>

      <Card title="Emergency">
        <button className="primary danger">
          🚨 Send Emergency Alert
        </button>
      </Card>
    </section>
  );
}

/* ---------------- ADMIN ---------------- */
function Admin() {
  return (
    <section className="section">
      <Card title="Admin Login">
        <input placeholder="Email" />
        <br /><br />
        <button className="primary">Login</button>
      </Card>

      <Card title="Live Dashboard">
        <p>Active Buses: 4</p>
        <p>Online Drivers: 3</p>
        <p>Trips Running: 2</p>
      </Card>

      <Card title="Manage Data">
        <ul>
          <li>Drivers</li>
          <li>Buses</li>
          <li>Routes</li>
          <li>Students</li>
        </ul>
      </Card>
    </section>
  );
}

/* ---------------- REUSABLE CARD ---------------- */
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default App;