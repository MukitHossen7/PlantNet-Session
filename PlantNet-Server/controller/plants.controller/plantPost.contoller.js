const { plantCollection } = require("../../collection/collection");

const plantPostController = async (req, res) => {
  const plant = req.body;
  const result = await plantCollection.insertOne(plant);
  res.send(result);
};
module.exports = plantPostController;
