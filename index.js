const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongodb start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ydu4ilk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("parcelDB");
    const parcelCollection = db.collection("parcels");

    // Get: All parcels or parcels by user (created_by), sorted by latest
    app.get("/parcels", async (req, res) => {
      try {
        const userEmail = req.query.email;

        const query = userEmail ? { created_by: userEmail } : {};
        const options = {
          sort: { createdAt: -1 }, // Newest first
        };
        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        res.status(500).send({ message: "Failed to get parcels" });
      }
    });

    // Post Parcel
    app.post("/parcels", async (req, res) => {
      try {
        const newParcel = req.body;

        const result = await parcelCollection.insertOne(newParcel);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create parcel" });
      }
    });

    // Delete Parcel by ID
    app.delete("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid parcel ID" });
        }

        const query = { _id: new ObjectId(id) };
        const result = await parcelCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to delete parcel", error: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("Parcel Server is running 🚚");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
