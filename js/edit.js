import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";

import { User, Validation, getBase64 } from "./funcs.js";

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")

const urlParams = new URLSearchParams(window.location.search);



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


const uid = await User.getUID(urlParams.get("u"))

const u = new User(uid)

const pub = await u.getData("public")

onAuthStateChanged(auth, async (user) => {
    const authUser = new User(user.uid)
    const meta = await authUser.getData("hidden")

    if (user.uid != uid && !meta.admin) {
        window.location.href = "../"
        return
    }
})

const oldUsername = await u.getUsername()


addField("Username:", (row) => {
    const inp = document.createElement("input")
    inp.id = "username"
    inp.value = oldUsername

    row.append(inp)
})

addField("Display Name:", (row) => {
    const inp = document.createElement("input")
    inp.id = "displayName"
    inp.value = pub.displayName

    row.append(inp)
})

addField("Description:", (row) => {
    row.style.placeItems = "start"
    row.style.flexDirection = "column"
    const inp = document.createElement("textarea")
    inp.rows = 5;
    inp.id = "desc"
    inp.maxLength = "50"
    inp.value = pub.desc

    row.append(inp)
})

const preview = document.createElement("img")
preview.id = "pfp"
preview.classList.add("border")
preview.src = "../img/pfp.jpg"

modal.append(preview)

if (pub.pfp) {
    preview.src = pub.pfp
}


addField("Upload:", (row) => {

    row.style.placeContent = "center"

    const inp = document.createElement("input")
    inp.type = "file"
    inp.name = "fileUpload"
    inp.accept = "image/png, image/jpeg"


    const lab = document.createElement("label")
    lab.innerText = "Select Image"
    lab.htmlFor = "fileUpload"



    lab.onclick = function () {
        inp.click()
    }

    inp.onchange = async function (event) {

        if (event.target.files[0].size > 1000000) {
            alert("That image is over 1 megabyte, please upload one under that size!")
            return
        }


        preview.src = await getBase64(event.target.files[0])
    }

    row.append(lab)
    row.append(inp)
})


addButton("Cancel", () => {
    window.location.href = "../user/index.html?u=" + oldUsername
})

addButton("Done", async () => {
    const usernameVal = document.getElementById("username").value
    const displayNameVal = document.getElementById("displayName").value
    const data = {

        displayName: displayNameVal,
        desc: document.getElementById("desc").value,
        pfp: document.getElementById("pfp").src

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

    await u.updateUsername(usernameVal)

    await u.updateData(data, "public")



    window.location.href = "../user/index.html?u=" + document.getElementById("username").value
})


modal.append(buttons)

content.append(modal)

