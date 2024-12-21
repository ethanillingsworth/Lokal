import { getDocs, query, collection, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { Event } from "./funcs.js";
import { db } from "./firebase.js";

const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(100)))

events.forEach(async ev => {
    const data = ev.data()

    if (new Date(data.date).getDate() >= new Date().getDate()) {
        const e = new Event(ev.id)
        await e.display()
    }
});