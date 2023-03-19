const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");

const PORT = process.env.PORT || 4000;
// middleware
app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.accessTokenSecret, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Access Forbidden" });
    }
    console.log("decoded ", decoded);
    req.decoded = decoded;
    next();
    //
  });
};

const uri = `mongodb+srv://${process.env.dbUser}:${process.env.dbPassword}@cluster0.f0u4qmq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const dessertCollection = client
      .db("restuarant")
      .collection("dessertCollection");
    const drinksCollection = client
      .db("restuarant")
      .collection("drinksCollection");
    const mainCollection = client.db("restuarant").collection("mainDishes");
    const cartCollection = client.db("restuarant").collection("cartCollection");

    // authentication token
    app.post("/api/token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.accessTokenSecret, {
        expiresIn: "1d",
      });
      res.send({ token: token });
    });

    // get dessert
    app.get("/api/desserts", async (req, res) => {
      const query = {};
      const cursor = dessertCollection.find(query);
      const desserts = await cursor.toArray();
      res.send(desserts);
    });

    // get a single item api
    app.get("/api/desserts/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const dessert = await dessertCollection.findOne(query);
      res.send(dessert);
    });

    // get drinks
    app.get("/api/drinks", async (req, res) => {
      const query = {};
      const cursor = drinksCollection.find(query);
      const drinks = await cursor.toArray();
      res.send(drinks);
    });

    // get a single item api
    app.get("/api/drinks/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const drink = await drinksCollection.findOne(query);
      res.send(drink);
    });

    // get main dishes
    app.get("/api/main", async (req, res) => {
      const query = {};
      const cursor = mainCollection.find(query);
      const main = await cursor.toArray();
      res.send(main);
    });

    // get a single item api
    app.get("/api/main/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const dish = await mainCollection.findOne(query);
      res.send(dish);
    });

    // add to cart api
    app.post("/api/cart", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    // get all cart items api
    app.get("/api/cart", verifyJwt, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const customerEmail = req.query.customerEmail;
      if (customerEmail === decodedEmail) {
        const query = { customerEmail: customerEmail };
        const cursor = cartCollection.find(query);
        const cart = await cursor.toArray();
        res.send(cart);
      } else {
        res.status(403).send({ message: "Access Forbidden" });
      }
    });

    app.delete("/api/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const cart = await cartCollection.deleteOne(query);
      res.send(cart);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(PORT, () => {
  console.log("Listening to port ", PORT);
});

/**
 * API Naming convention
 * app.get("/api/content") - get all content
 * app.get("/api/content/:id) - get individual content by id
 * app.post("/api/content") - add a new content
 * app.patch("/api/content/:id") - update content
 * app.delete("/api/content/:id") - delete content
 */

// backend url: https://kayi-tribe-restuarant.onrender.com
