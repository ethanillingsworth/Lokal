import { getDoc, doc, query, collection, setDoc, deleteDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";

import { updateUserData, updateUsername, Validation } from "./funcs.js";

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")
modal.style.placeItems = "start"


function addField(head, action) {
    const row = document.createElement("div")
    row.classList.add("row")
    row.style.placeContent = "start"

    const heading = document.createElement("h3")
    heading.innerText = head

    row.append(heading)

    action(row)

    modal.append(row)
}



const buttons = document.createElement("div")
buttons.classList.add("row")

function addButton(label, onclick) {
    const button = document.createElement('button')
    button.innerText = label
    buttons.append(button)

    button.onclick = () => {
        onclick()
    }
}



onAuthStateChanged(auth, async (user) => {
    if (!user) {

        location.href = "../login"

    }
    addField("Username:", (row) => {
        const inp = document.createElement("input")
        inp.id = "username"

        row.append(inp)
    })

    addField("Display Name:", (row) => {
        const inp = document.createElement("input")
        inp.id = "displayName"

        row.append(inp)
    })

    addField("Description:", (row) => {
        row.style.placeItems = "start"
        row.style.flexDirection = "column"
        const inp = document.createElement("textarea")
        inp.rows = 5;
        inp.id = "desc"
        inp.maxLength = "50"

        row.append(inp)
    })

    const uid = user.uid;

    const usernameRef = await getDoc(doc(db, "usernames", uid))

    if (usernameRef.exists()) {
        const oldUsername = usernameRef.data().username

        addButton("Cancel", () => {
            window.location.href = "../user/index.html?u=" + oldUsername
        })

        addButton("Done", async () => {
            const usernameVal = document.getElementById("username").value
            const displayNameVal = document.getElementById("displayName").value
            const data = {

                displayName: displayNameVal,
                desc: document.getElementById("desc").value

            }


            if (Validation.username(usernameVal) != true) {
                alert(Validation.username(usernameVal))
                return
            }

            if (usernameVal != oldUsername && await Validation.finalUsername(usernameVal) != true) {
                alert(await Validation.finalUsername(usernameVal))
                return
            }

            if (Validation.displayName(displayNameVal) != true) {
                alert(Validation.displayName(displayNameVal))
                return
            }

            await updateUsername(user.uid, usernameVal)

            await updateUserData(user.uid, data, "public")



            window.location.href = "../user/index.html?u=" + document.getElementById("username").value
        })

        document.getElementById("username").value = oldUsername
    }

    const pub = await getDoc(doc(db, "users", uid, "data", "public"))

    if (pub.exists()) {
        const data = pub.data()
        document.getElementById("displayName").value = data.displayName

        document.getElementById("desc").value = data.desc


    }

    modal.append(buttons)



});



content.append(modal)

