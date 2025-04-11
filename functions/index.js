
// index.js
const functions = require("firebase-functions");
const express = require("express");

const app = express();

app.get("/test", (req, res) => {
    res.json({
        "message": "test"
    })
});

exports.api = functions.https.onRequest(app);
