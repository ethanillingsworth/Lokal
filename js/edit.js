import { getDoc, doc, query, collection, setDoc, deleteDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")
modal.style.placeItems = "start"


function nameChecks(value, name) {

    if (value.length < 5) {
        return name + " must be atleast 5 chars long"
    }

    if (value.length > 15) {
        return name + " cannot be over 15 chars long"
    }

    if (value.startsWith("_") || value.endsWith("_")) {
        return name + " cannot have an _ at the start or end"
    }
    if (value.startsWith("-") || value.endsWith("-")) {
        return name + " cannot have a - at the start or end"
    }

    if (!value.match(/^[A-Za-x0-9._.-]+$/)) {
        return name + " can only contain Alphanumric chars\n Along with chars such as '_' or '-'"
    }


    return "Good"
}


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
            if (nameChecks(document.getElementById("username").value, "Username") != "Good") {
                alert(nameChecks(document.getElementById("username").value, "Username"))
                return
            }

            if (document.getElementById("displayName").value.length > 20) {
                alert("Display name cannot be over 20 chars")
                return
            }

            if (document.getElementById("displayName").value.length < 5) {
                alert("Display name must be over 5 chars")
                return
            }

            await setDoc(doc(db, "usernames", uid), {
                username: document.getElementById("username").value
            })

            await deleteDoc(doc(db, "uids", oldUsername))

            await setDoc(doc(db, "uids", document.getElementById("username").value), {
                userId: uid
            })

            await setDoc(doc(db, "users", uid, "data", "public"), {
                displayName: document.getElementById("displayName").value,
                desc: document.getElementById("desc").value,

            }, {merge: true})

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

