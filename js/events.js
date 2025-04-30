import { getDocs, query, collection, orderBy, limit, where, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { Event, User, CSS } from "./funcs.js";
CSS.loadFiles(["../css/events.css"])
import { db, auth } from "./firebase.js";


onAuthStateChanged(auth, async (u) => {

    if (!u) {
        window.location.href = "../login"
    }

    const loading = $("<h3/>").text("Loading...").css("margin-top", "20px")

    $("#content").append(loading)

    const groups = await getDocs(query(collection(db, "schools", window.getSchool(), "users"), where("badges", "array-contains", "group")))
    let eventsArray = [];

    for (const g of groups.docs) {

        const groupId = g.id


        const group = new User(groupId)

        const readOnly = await group.getMemberReadOnly(u.uid)
        const dat = await group.getMember(u.uid)


        if (!dat.joined || !readOnly.accepted) {
            continue
        }

        const events = await getDocs(query(collection(db, "schools", window.getSchool(), "posts"), orderBy("timestamp", "desc"), where("creator", "==", groupId), limit(100)))

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

    }

    // Sort events by date (earliest first)
    eventsArray.sort((a, b) => a.date - b.date);

    if (eventsArray.length > 0) {
        loading.remove()
    }
    else {
        loading.text("You have no upcoming events...")
    }

    let index = 0;
    for (const item of eventsArray) {
        if (index !== 0) {
            $("#content").append($("<hr/>"));
        }

        await item.event.display(); // Display in sorted order
        index++;
    }



})