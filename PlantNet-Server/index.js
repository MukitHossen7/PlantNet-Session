require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const { connection, client } = require("./DB/PlantNetDB");
const stripe = require("stripe")(process.env.PAYMENT_SERECT_KEY);
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const { ObjectId } = require("mongodb");
const plantPostController = require("./controller/plants.controller/plantPost.contoller");
const verifyAdmin = require("./middleware/verifyAdmin");
const verifySeller = require("./middleware/verifySeller");
const verifyToken = require("./middleware/verifyToken");
const {
  userCollection,
  plantCollection,
  orderInfoCollection,
} = require("./collection/collection");
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

//Send email notification using nodemailer
const sendEmail = (emailAddress, emailData) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take messages", success);
    }
  });
  const mailBody = {
    from: process.env.NODEMAILER_USER,
    to: emailAddress,
    subject: emailData?.subject,
    html: `<p>${emailData?.massage}</p>`,
  };
  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: ", info?.response);
    }
  });
};
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

//Admin Stat
app.get("/admin-stat", verifyToken, verifyAdmin, async (req, res) => {
  const totalUsers = await userCollection.estimatedDocumentCount();
  const totalPlants = await plantCollection.estimatedDocumentCount();
  //chart aggregates data
  const chartData = await orderInfoCollection
    .aggregate([
      {
        $sort: { _id: -1 },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$_id" },
            },
          },
          quantity: {
            $sum: "$quantity",
          },
          price: {
            $sum: "$price",
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          quantity: 1,
          price: 1,
        },
      },
    ])
    .toArray();
  const ordersDetails = await orderInfoCollection
    .aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ])
    .next();
  res.send({ totalUsers, totalPlants, chartData, ...ordersDetails });
});

//create payment intent
app.post("/create-payment-intent", verifyToken, async (req, res) => {
  const { quantity, plantId } = req.body;
  const plant = await plantCollection.findOne({ _id: new ObjectId(plantId) });
  if (!plant) {
    return res.status(400).send({ message: "Plant not found" });
  }
  const amount = plant.price * quantity * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  res.send(paymentIntent.client_secret);
});

//update uses role and status in database
app.patch(
  "/single-user/role/:email",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const email = req.params.email;
    const { role } = req.body;
    const query = { email: email };
    const updateDoc = {
      $set: { role: role, status: "Verify" },
    };
    const result = await userCollection.updateOne(query, updateDoc);
    res.send(result);
  }
);

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
app.post("/plants", verifyToken, verifySeller, plantPostController);

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

//get plant data in database by added email
app.get("/plants/email/:email", verifyToken, verifySeller, async (req, res) => {
  const email = req.params.email;
  const plants = await plantCollection
    .find({ "seller.email": email })
    .toArray();
  res.send(plants);
});

//delete a plant from database by seller
app.delete("/plants/:id", verifyToken, verifySeller, async (req, res) => {
  const id = req.params.id;
  const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//update status in database for ordersCollections
app.patch(
  "/manages-orders/:id",
  verifyToken,
  verifySeller,
  async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    const query = { _id: new ObjectId(id) };
    let updataDoc = {
      $set: { status: status },
    };

    const result = await orderInfoCollection.updateOne(query, updataDoc);
    res.send(result);
  }
);
//user oderInfo save in database
app.post("/orders", verifyToken, async (req, res) => {
  const orderInfo = req.body;
  const result = await orderInfoCollection.insertOne(orderInfo);
  if (result.insertedId) {
    //To Customer
    sendEmail(orderInfo.customer.email, {
      subject: "Order Confirmation",
      massage: `Your order has been confirmed. Order ID: ${result?.insertedId}`,
    });
    //To Seller
    sendEmail(orderInfo.seller, {
      subject: "Hurray!, You have an order to process",
      massage: `Get the Plants ready for ${orderInfo?.customer?.name}`,
    });
  }
  res.send(result);
});

//get orderInfo in database by customer login email
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

//get orderInfo in database by seller email
app.get(
  "/seller-orders/:email",
  verifyToken,
  verifySeller,
  async (req, res) => {
    const email = req.params.email;
    const query = { seller: email };
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
        {
          $unwind: "$plant",
        },
        {
          $addFields: {
            name: "$plant.name",
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
  }
);

//delete order data in database
app.delete("/orders/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const order = await orderInfoCollection.findOne({ _id: new ObjectId(id) });
  if (order.status === "delivered" || order.status === "Delivered") {
    return res.status(400).send({ message: "Cannot delete delivered order" });
  }
  const result = await orderInfoCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//delete manage order data in database
app.delete(
  "/manages-orders/:id",
  verifyToken,
  verifySeller,
  async (req, res) => {
    const id = req.params.id;
    const order = await orderInfoCollection.findOne({ _id: new ObjectId(id) });
    if (order.status === "delivered") {
      return res.status(403).send({ message: "Cannot delete delivered order" });
    }
    const result = await orderInfoCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  }
);
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
