require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connection, client } = require("./DB/PlantNetDB");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const { ObjectId } = require("mongodb");
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
const orderInfoCollection = client.db("plantNetDB").collection("orders");

//Verify token
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

//Verify Admin
const verifyAdmin = async (req, res, next) => {
  const email = req.user.email;
  const query = { email };
  const result = await userCollection.findOne(query);
  if (!result || result.role !== "admin") {
    return res.status(403).send({ message: "unauthorized access" });
  }
  next();
};

//Verify Seller
const verifySeller = async (req, res, next) => {
  const email = req.user.email;
  const query = { email };
  const result = await userCollection.findOne(query);
  if (!result || result.role !== "seller") {
    return res.status(403).send({ message: "unauthorized access" });
  }
  next();
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

//get all user in database
app.get("/all-users/:email", verifyToken, verifyAdmin, async (req, res) => {
  const email = req.params.email;
  const query = { email: { $ne: email } };
  const users = await userCollection.find(query).toArray();
  res.send(users);
});

//update uses role and status in database
app.patch("/single-user/role/:email", async (req, res) => {
  const email = req.params.email;
  const { role } = req.body;
  const query = { email: email };
  const updateDoc = {
    $set: { role: role, status: "Verify" },
  };
  const result = await userCollection.updateOne(query, updateDoc);
  res.send(result);
});
//get user role
app.get("/user/role/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user) {
    return res.send(user.role);
  } else {
    return res.status(404).send({ message: "User not found" });
  }
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

//set user status in user collection
app.patch("/check_user/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await userCollection.findOne({ email: email });
  if (!user || user.status === "Requested")
    return res
      .status(400)
      .send({ message: "You have already requested, wait for some time" });
  const updateDoc = {
    $set: { status: "Requested" },
  };
  const result = await userCollection.updateOne(query, updateDoc);
  res.send(result);
});

//save plantData in database
app.post("/plants", verifyToken, verifySeller, async (req, res) => {
  const plant = req.body;
  const result = await plantCollection.insertOne(plant);
  res.send(result);
});

//get plant data in database
app.get("/plants", async (req, res) => {
  const plants = await plantCollection.find().toArray();
  res.send(plants);
});

//get plant data in database by id
app.get("/plant/:id", async (req, res) => {
  const id = req.params.id;
  const plant = await plantCollection.findOne({ _id: new ObjectId(id) });
  res.send(plant);
});

//user oderInfo save in database
app.post("/orders", verifyToken, async (req, res) => {
  const orderInfo = req.body;
  const result = await orderInfoCollection.insertOne(orderInfo);
  res.send(result);
});

//get orderInfo in database by user login email
app.get("/customers-order/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { "customer.email": email };
  const orders = await orderInfoCollection
    .aggregate([
      {
        $match: query,
      },
      {
        $addFields: {
          plantId: { $toObjectId: "$plantId" },
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "plantId",
          foreignField: "_id",
          as: "plant",
        },
      },
      { $unwind: "$plant" },
      {
        $addFields: {
          name: "$plant.name",
          image: "$plant.image",
          category: "$plant.category",
        },
      },
      {
        $project: {
          plant: 0,
        },
      },
    ])
    .toArray();
  res.send(orders);
});

//delete order data in database
app.delete("/orders/:id", async (req, res) => {
  const id = req.params.id;
  const order = await orderInfoCollection.findOne({ _id: new ObjectId(id) });
  if (order.status === "delivered") {
    return res.status(403).send({ message: "Cannot delete delivered order" });
  }
  const result = await orderInfoCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//update quantity in database
app.patch("/orders/quantity/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const { totalQuantity, status } = req.body;
  const query = { _id: new ObjectId(id) };
  let updataDoc = {
    $inc: { quantity: -totalQuantity },
  };
  if (status === "increase") {
    updataDoc = {
      $inc: { quantity: totalQuantity },
    };
  }
  const result = await plantCollection.updateOne(query, updataDoc);
  res.send(result);
});
app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
