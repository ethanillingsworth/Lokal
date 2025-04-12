
// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

admin.initializeApp();
const db = admin.firestore();

const app = express();

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user to request for access in routes
        next(); // Go to actual handler
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
}

function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

app.get("/createEvent", authenticate, async (req, res) => {
    try {
        const data = {
            type: req.body.type,
            title: req.body.title,
            desc: req.body.desc,
            creator: req.body.creator,
        };

        // Basic validation
        if (!type) {
            return res.status(400).json({ error: "Post type not specified." });
        }

        if (type != "UPDATE" && type != "EVENT" && type != "MEDIA") {
            return res.status(400).json({ error: "Post type is invalid." });
        }

        if (!title) {
            return res.status(400).json({ error: "Post title is not specified." });
        }

        if (!creator) {
            return res.status(400).json({ error: "Post creator is not specified." });
        }

        const newPost = {
            type: data.type,
            title: data.title,
            description: data.description || "",
            timestamp: Date.now(),
            creator: data.creator,
        };

        if (type == "EVENT") {
            newPost = {
                ...newPost,
                agenda: req.body.agenda || "",
                category: req.body.category || "",
                cost: req.body.cost || "0",
                date: req.body.date || formatDate(new Date()),
                location: req.body.location || "None",
                actions: []
            }
        }

        const docRef = await db.collection("posts").add(newPost);

        res.status(201).json({
            message: "Post created successfully",
            postId: docRef.id,
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

exports.api = functions.https.onRequest(app);
