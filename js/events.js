import { getDocs, query, collection, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { Event, User } from "./funcs.js";
import { db, auth } from "./firebase.js";

onAuthStateChanged(auth, async (u) => {

    if (!u) {
        window.location.href = "../login"
    }

    const events = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(100)))

    let index = 0;
    events.forEach(async ev => {
        const data = ev.data()

        const creator = new User(data.creator)

        if (new Date(data.date).getMonth() >= new Date().getMonth()
            && new Date(data.date).getDay() >= new Date().getDay()
            && Object.keys(await creator.getMember(u.uid)).length > 0) {
            const e = new Event(ev.id)
            if (index != 0) {
                $("#content").append($("<hr/>"))
            }

            await e.display()
            index++;
        }
    });

})