import { getDocs, query, collection, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { Event, User, CSS } from "./funcs.js";
CSS.loadFiles(["../css/events.css"])
import { db, auth } from "./firebase.js";


onAuthStateChanged(auth, async (u) => {

    if (!u) {
        window.location.href = "../login"
    }

    const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(100)))

    let eventsArray = [];

    // Collect events into an array
    for (const ev of events.docs) {
        const data = ev.data();


        const eventDate = new Date(data.date);
        eventDate.setHours(23)
        const currentDate = new Date();

        if ((eventDate.getTime() >= currentDate.getTime())) {

            eventsArray.push({ event: new Event(ev.id), date: eventDate });
        }
    }

    // Sort events by date (earliest first)
    eventsArray.sort((a, b) => a.date - b.date);

    let index = 0;
    for (const item of eventsArray) {
        if (index !== 0) {
            $("#content").append($("<hr/>"));
        }

        await item.event.display(); // Display in sorted order
        index++;
    }

})