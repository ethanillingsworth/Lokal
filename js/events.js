import { getDocs, query, collection, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { Event, User } from "./funcs.js";
import { db, auth } from "./firebase.js";

onAuthStateChanged(auth, async (u) => {

    if (!u) {
        window.location.href = "../"
    }

    const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(100)))

    events.forEach(async ev => {
        const data = ev.data()

        const creator = new User(data.creator)

        if (new Date(data.date).getDate() >= new Date().getDate() && Object.keys(await creator.getMember(u.uid)).length > 0) {
            const e = new Event(ev.id)

            await e.getUData()
            await e.display()
        }
    });

})