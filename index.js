const { MongoClient, ServerApiVersion } = require("mongodb");
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
    app.get("/api/dessert", async (req, res) => {
      const query = {};
      const cursor = dessertCollection.find(query);
      const dessert = await cursor.toArray();
      res.send(dessert);
    });

    // get drinks
    app.get("/api/drinks", async (req, res) => {
      const query = {};
      const cursor = drinksCollection.find(query);
      const drinks = await cursor.toArray();
      res.send(drinks);
    });

    // get main dishes
    app.get("/api/main", async (req, res) => {
      const query = {};
      const cursor = mainCollection.find(query);
      const main = await cursor.toArray();
      res.send(main);
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
