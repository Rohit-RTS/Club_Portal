const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");

// middle ware

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.send("Access denied. Please login.");
  }

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = verified;
    next();
  } catch (err) {
    res.send("Invalid token");
  }
}

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL");
});

// Show Register Page
app.get("/register", (req, res) => {
  res.render("register");
});

// Register User
app.post("/register", async (req, res) => {
  try {
    const { name, email, password,branch,year } = req.body;

    if (!name || !email || !password||!branch||!year) {
      return res.send("All fields are required");
    }

    const checkUser = "SELECT * FROM users WHERE email = ?";

    db.query(checkUser, [email], async (err, result) => {
      if (err) return res.send("Database error");

      if (result.length > 0) {
        return res.send("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery =
        "INSERT INTO users (name, email, password,branch,year) VALUES (?, ?, ?,?,?)";

      db.query(
        insertQuery,
        [name, email, hashedPassword,branch,year],
        (err, result) => {
          if (err) return res.send("Registration failed");

          res.send("User registered successfully ✅");
        }
      );
    });

  } catch (error) {
    console.log(error);
    res.send("Server error");
  }
});
// login

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send("All fields required");
  }

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, result) => {

    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    if (result.length === 0) {
      return res.send("User not found");
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send("Invalid password");
    }

    const token = jwt.sign(
      { id: user.id,name:user.name, email: user.email,branch:user.branch,year:user.year, time:user.created_at },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true
    });

    // ✅ IMPORTANT
    return res.redirect("/dashboard");
  });
});

app.get("/dashboard", authMiddleware, (req, res) => {
  res.render("dashboard", {
    username: req.user.name,
    branch:req.user.branch,
    email:req.user.email,
    year:req.user.year,
    time:req.user.created_at
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// Route for the clubs

