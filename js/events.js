import { getDoc, doc, getDocs, query, setDoc, collection, orderBy, addDoc, Timestamp, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { displayEvent } from "./global.js";
import { db } from "./firebase.js";

const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(100)))

events.forEach(async ev => {
    const data = ev.data()

    if (new Date(data.date).getDate() >= new Date(Date.now()).getDate()) {
        await displayEvent(ev.id)
    }
});