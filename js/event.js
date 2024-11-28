import { getDoc, doc, setDoc, updateDoc, collection, addDoc, Timestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search)


const content = document.getElementById("content")

const modal = document.createElement("div")

modal.classList.add("modal")

content.append(modal)


const d = await getDoc(doc(db, "posts", urlParams.get("e")))

if (d.exists()) {
    const data = d.data()

    const row = document.createElement("div")
    row.classList.add("row")
    
    const title = document.createElement("h2")

    title.innerText = data.title

    document.title = `Lokal - ${data.title}`

    row.append(title)

    const usernames = await getDoc(doc(db, "usernames", data.creator))

    if (usernames.exists()) {
        const username = usernames.data().username

        const uname = document.createElement("h3")

        uname.innerText = `(@${username})`
        uname.style.color = "gray"

        row.append(uname)
    }

    modal.append(row)
    modal.append(document.createElement("hr"))

    const date = document.createElement("h4")
    const location = document.createElement("h4")
    const cost = document.createElement("h4")

    date.innerText = `Date: ${new Date(data.date).toLocaleDateString("en-US")}`
    location.innerText = `Location: ${data.location}`
    if (data.cost > 0) {
        cost.innerText = `Cost: ${data.cost}`
        modal.append(cost)
    }

    modal.append(date)
    modal.append(location)

    const desc = document.createElement("p")
    desc.innerHTML = `<b>Summary:</b> ${data.desc}`

    modal.append(desc)

    modal.append(document.createElement("hr"))

    const agendaHeading = document.createElement("h3")
    agendaHeading.innerHTML = "<b>Agenda:</b>"
    modal.append(agendaHeading)

    const agenda = document.createElement("p")

    agenda.innerHTML = data.agenda

    modal.append(agenda)

    modal.append(document.createElement("hr"))

    const buttons = document.createElement("div")
    buttons.classList.add("row")

    function addButton(label) {
        const button = document.createElement("button")
        button.innerText = label

        buttons.append(button)
    }

    modal.append(buttons)

    addButton("Hello")



}