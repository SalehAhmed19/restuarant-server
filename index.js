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

function verifyJWT(req, res, next) {
  // console.log("token inside jwt", req.headers.authorization);
  const authHeader = req.headers.authorization;
  // console.log(authHeader);
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

// function verifyJwt(req, res, next) {
//   const authHeader = req.headers.authorization;
//   // console.log(authHeader);
//   if (!authHeader) {
//     return res.status(401).send({ message: "Unauthorized Access" });
//   }
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.JWT_TOKEN_SECRET, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "Access Forbidden" });
//     }
//     req.decoded = decoded;
//     console.log("first", token);
//     next();
//   });
// }

// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send({ message: "Unauthorized" });
//   }
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "Forbidden" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// };

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

    // authentication token
    // app.post("/api/token", async (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {
    //     expiresIn: "1d",
    //   });
    //   res.send({ token: token });
    // });

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

    // create user
    // app.put("/api/users/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const filter = { email: email };
    //   const user = req.body;
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: user,
    //   };
    //   const result = await usersCollection.updateOne(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   const token = jwt.sign({ email: email }, process.env.JWT_TOKEN_SECRET, {
    //     expiresIn: "1d",
    //   });
    //   res.send({ result: result, accessToken: token });
    // });

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
      // const token = jwt.sign({ email: email }, process.env.JWT_TOKEN_SECRET, {
      //   expiresIn: "1d",
      // });
      res.send({ result: result });
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
