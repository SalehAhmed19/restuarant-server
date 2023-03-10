const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT || 4000;
// middleware
app.use(cors());
app.use(express.json());

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
      console.log("Print: " + id);
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

    app.get("/api/main/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Print: " + id);
      const query = {
        _id: new ObjectId(id),
      };
      const dish = await mainCollection.findOne(query);
      res.send(dish);
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
