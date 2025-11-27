const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NextLevel shop server is running!');
})

// MongoDB URI from .env
const uri = process.env.MONGO_URI;

// Stable MongoDB Client (same as your movie project)
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

let productsCollection;
let usersCollection;

// Connect Database
async function connectDB() {
    try {
        // await client.connect();

        const db = client.db("nextDB");

        productsCollection = db.collection("products");
        usersCollection = db.collection("users");

        // REGISTER USER
        app.post("/register", async (req, res) => {
            const { name, email, password } = req.body;

            try {
                const existing = await usersCollection.findOne({ email });
                if (existing) {
                    return res.status(400).json({ message: "User already exists" });
                }

                const hashed = await bcrypt.hash(password, 10);

                const result = await usersCollection.insertOne({
                    name,
                    email,
                    password: hashed,
                });

                res.status(201).json({
                    _id: result.insertedId,
                    name,
                    email,
                });
            } catch (err) {
                res.status(500).json({ message: "Registration failed" });
            }
        });

        // LOGIN USER
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;

            try {
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                });
            } catch (err) {
                res.status(500).json({ message: "Login failed" });
            }
        });

        // GET ALL PRODUCTS
        app.get("/products", async (req, res) => {
            const products = await productsCollection.find({}).toArray();
            res.json(products);
        });

        // GET SINGLE PRODUCT
        app.get("/products/:id", async (req, res) => {
            try {
                const product = await productsCollection.findOne({
                    _id: new ObjectId(req.params.id),
                });

                if (!product) return res.status(404).json({ message: "Not found" });

                res.json(product);
            } catch {
                res.status(400).json({ message: "Invalid ID" });
            }
        });

        // CREATE PRODUCT
        app.post("/products", async (req, res) => {
            const doc = req.body;
            const result = await productsCollection.insertOne(doc);
            res.status(201).json({ _id: result.insertedId, ...doc });
        });

        // DELETE PRODUCT
        app.delete("/products/:id", async (req, res) => {
            try {
                await productsCollection.deleteOne({
                    _id: new ObjectId(req.params.id),
                });

                res.json({ message: "Deleted" });
            } catch {
                res.status(400).json({ message: "Invalid ID" });
            }
        });

    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}


connectDB().catch(console.dir);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
