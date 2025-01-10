const { userCollection } = require("../collection/collection");

const verifySeller = async (req, res, next) => {
  const email = req.user.email;
  const query = { email };
  const result = await userCollection.findOne(query);
  if (!result || result.role !== "seller") {
    return res.status(403).send({ message: "unauthorized access" });
  }
  next();
};
module.exports = verifySeller;
