

import { https } from "firebase-functions";

export const helloWorld = https.onRequest((req, res) => {
    res.send("Hello from your custom Firebase Function!");
});
