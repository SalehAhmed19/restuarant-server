const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const cors = require("cors");

const PORT = process.env.PORT || 4000;
// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// verify JWT function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Access Forbidden" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const usersCollection = client
      .db("restuarant")
      .collection("usersCollection");

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
    app.get("/api/cart", verifyJWT, async (req, res) => {
      const customerEmail = req.query.email;
      const decodedEmail = req.decoded.email;
      // console.log(customerEmail === decodedEmail);
      if (customerEmail !== decodedEmail) {
        return res.status(403).send({ message: "Access Forbidden" });
      }
      const query = { customerEmail: customerEmail };
      const cursor = cartCollection.find(query);
      const cart = await cursor.toArray();
      res.send(cart);
    });

    // delete cart item api
    app.delete("/api/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const cart = await cartCollection.deleteOne(query);
      res.send(cart);
    });

    app.get("/api/jwt", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.put("/api/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send({ result: result });
    });

    // stripe checkout
    app.post("/api/create-checkout-session", async (req, res) => {
      const line_items = req.body.carts.map((item) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.food,
              images: [item.foodImg],
              des: item.des,
              metadata: {
                id: item._id,
              },
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        };
      });
      const session = await stripe.checkout.sessions.create({
        shipping_address_collection: { allowed_countries: ["US", "CA", "BD"] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Free shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ],
        phone_number_collection: { enabled: true },
        line_items: line_items,
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/checkout-success`,
        cancel_url: `${process.env.FRONTEND_URL}/cart`,
      });
      res.send({ url: session.url });
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
