import { getDocs, limit, query, collection, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { db } from "./firebase.js";
import { Event, User } from "./funcs.js"

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")

const urlParams = new URLSearchParams(window.location.search)

const heading = document.createElement("h3")
const search = urlParams.get("q").replaceAll("-", " ").toLowerCase()

heading.innerText = "Results for \"" + search + '"'


const q = query(collection(db, "posts"), limit(50))
const qu = query(collection(db, "usernames"), limit(100))


const ref = await getDocs(q)

const refU = await getDocs(qu)

ref.forEach(async (d) => {
    const data = d.data()
    if (data.title.toLowerCase().includes(search) || data.desc.toLowerCase().includes(search) || data.category.toLowerCase().includes(search)
        || data.date.toLowerCase().includes(search) || data.location.toLowerCase().includes(search)) {

        const e = new Event(d.id)

        await e.display(modal)
    }
});

refU.forEach(async (d) => {
    const uid = d.id

    const user = new User(uid)

    const pub = await user.getData("public")
    const meta = await user.getData("hidden")

    const username = d.data().username

    console.log(pub)


    if (search.includes(pub.displayName.toLowerCase()) || pub.desc.toLowerCase().includes(search)
        || username.toLowerCase().includes(search)) {

        await User.display(username, pub, meta, modal)

    }
});


modal.append(heading)

content.append(modal)