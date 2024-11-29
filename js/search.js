import { getDoc, doc, getDocs, deleteDoc, limit, setDoc, query, collection, where, Timestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { displayEvent } from "./global.js"

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")

const urlParams = new URLSearchParams(window.location.search)

const heading = document.createElement("h3")
const search = urlParams.get("q").replaceAll("-", " ")

heading.innerText = "Results for \"" + search + '"'


const q = query(collection(db, "posts"), limit(100))

const ref = await getDocs(q)

ref.forEach((d) => {
    const data = d.data()
    if (data.title.toLowerCase().includes(search) || data.desc.toLowerCase().includes(search) || data.category.toLowerCase().includes(search)
        || data.date.toLowerCase().includes(search) || data.location.toLowerCase().includes(search)) {
        displayEvent(d.id, modal)
    }
});

modal.append(heading)

content.append(modal)