const { client } = require("../DB/PlantNetDB");
const userCollection = client.db("plantNetDB").collection("users");
const plantCollection = client.db("plantNetDB").collection("plants");
const orderInfoCollection = client.db("plantNetDB").collection("orders");

module.exports = { userCollection, plantCollection, orderInfoCollection };
