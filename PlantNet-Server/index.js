require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connection, client } = require("./DB/PlantNetDB");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const port = process.env.PORT || 5000;
const app = express();
connection();
// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

//create user collection
const userCollection = client.db("plantNetDB").collection("users");
const plantCollection = client.db("plantNetDB").collection("plants");

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

// Generate jwt token
app.post("/jwt", async (req, res) => {
  const email = req.body;
  const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "365d",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});
// Logout
app.get("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (err) {
    res.status(500).send(err);
  }
});

// save user info
app.post("/users", async (req, res) => {
  const user = req.body;
  const email = req.body.email;
  const existingUser = await userCollection.findOne({ email: email });
  if (existingUser) {
    return res.send(existingUser);
  }
  const result = await userCollection.insertOne({
    ...user,
    role: "customer",
    timestamp: Date.now(),
  });
  res.send(result);
});

//check login use query
app.post("/check-user", async (req, res) => {
  const email = req.body.email;
  const user = await userCollection.findOne({ email: email });
  if (user) {
    return res.send(user);
  } else {
    return res.status(404).send({ message: "User not found" });
  }
});
//save plantData in database
app.post("/plants", async (req, res) => {
  const plant = req.body;
  const result = await plantCollection.insertOne(plant);
  res.send(result);
});

//get plant data in database
app.get("/plants", async (req, res) => {
  const plants = await plantCollection.find().toArray();
  res.send(plants);
});
app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
