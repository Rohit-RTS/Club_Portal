const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.static("public"));   
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

// Create DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ Connected to MySQL Database");
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


app.get("/register", (req, res) => {
  res.render("register");
});

// REGISTER ROUTE

app.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.render("register", { message: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {

    if (err) {
      console.log(err);
      return res.render("register", { message: "Database error" });
    }

    //  CHECK IF USER ALREADY EXISTS
    if (result.length > 0) {
      return res.render("register", { message: "Email already registered" });
    }

    //  HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    //  INSERT INTO DATABASE
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {

        if (err) {
          console.log(err);
          return res.render("register", { message: "Registration failed" });
        }

        res.redirect("/login");
      }
    );

  });

});
