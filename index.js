const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.URI;


const client = new MongoClient(uri);
let productsCollection;

// Connect to DB and cache collection
async function connectDB() {
    try {
        await client.connect();
        const db = client.db("nextDB");
        productsCollection = db.collection("products");
        console.log(" Connected to MongoDB (nextDB.products)");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
connectDB();

// GET all products
app.get("/products", async (req, res) => {
    const products = await productsCollection.find({}).toArray();
    res.json(products);
});

// GET single product by _id
app.get("/products/:id", async (req, res) => {
    try {
        const product = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!product) return res.status(404).json({ message: "Not found" });
        res.json(product);
    } catch {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// POST create new product
app.post("/products", async (req, res) => {
    const doc = req.body;
    const result = await productsCollection.insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
});

// DELETE product by _id
app.delete("/products/:id", async (req, res) => {
    try {
        await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Deleted" });
    } catch {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
