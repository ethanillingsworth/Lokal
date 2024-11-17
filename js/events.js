import { getDoc, doc, getDocs, query, setDoc, collection, orderBy, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { displayEvent } from "./global.js";
import { db } from "./firebase.js";

const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc")))

events.forEach(async ev => {
    await displayEvent(ev.id)
});