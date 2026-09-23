import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
const PORT = 5000;
const db = new sqlite3.Database("./students.db");

app.use(cors());
app.use(express.json());

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    avatar TEXT
  )`);

  db.get("SELECT COUNT(*) AS count FROM students", (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare("INSERT INTO students (name,email,phone,course,year,status,avatar) VALUES (?,?,?,?,?,?,?)");
      [
        ["Aarav Sharma","aarav@example.com","+91 98765 43210","Computer Science","3rd Year","Active","AS"],
        ["Diya Reddy","diya@example.com","+91 98765 43211","Information Technology","2nd Year","Active","DR"],
        ["Rahul Kumar","rahul@example.com","+91 98765 43212","Data Science","4th Year","Active","RK"],
        ["Ananya Rao","ananya@example.com","+91 98765 43213","Computer Science","1st Year","Inactive","AR"]
      ].forEach(s => stmt.run(s));
      stmt.finalize();
    }
  });
});

app.get("/api/students", (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/students", (req, res) => {
  const { name, email, phone, course, year, status = "Active" } = req.body;
  if (!name || !email || !course || !year) return res.status(400).json({ error: "Name, email, course and year are required." });
  db.run(
    "INSERT INTO students (name,email,phone,course,year,status,avatar) VALUES (?,?,?,?,?,?,?)",
    [name, email, phone || "", course, year, status, name.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM students WHERE id = ?", [this.lastID], (e, row) => res.status(201).json(row));
    }
  );
});

app.put("/api/students/:id", (req, res) => {
  const { name, email, phone, course, year, status } = req.body;
  db.run(
    "UPDATE students SET name=?,email=?,phone=?,course=?,year=?,status=? WHERE id=?",
    [name, email, phone || "", course, year, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: "Student not found" });
      db.get("SELECT * FROM students WHERE id=?", [req.params.id], (e, row) => res.json(row));
    }
  );
});

app.delete("/api/students/:id", (req, res) => {
  db.run("DELETE FROM students WHERE id=?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get("/api/stats", (req, res) => {
  db.get(`SELECT COUNT(*) total,
    SUM(status='Active') active,
    SUM(status='Inactive') inactive
    FROM students`, [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        students: row.total || 0,
        active: row.active || 0,
        inactive: row.inactive || 0,
        attendance: 92,
        feesCollected: 78
      });
    });
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
