import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";

import { User, Validation, getBase64, rgbToHex } from "./funcs.js";

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

let pageUser = undefined

if (urlParams.get("u")) {

    pageUser = new User(await User.getUID(urlParams.get("u")))
}


onAuthStateChanged(auth, async (user) => {
    const authUser = new User(user.uid)
    const meta = await authUser.getData("hidden")

    const memberData = await pageUser.getMember(authUser.uid)



    if (urlParams.get("createGroup") && urlParams.get("u")) {
        window.location.href = "../"
        return
    }

    if (user.uid == pageUser.uid || meta.admin || memberData.admin) {

    }
    else {
        window.location.href = "../"

        return
    }

})



addField("Username:", (row) => {
    const inp = document.createElement("input")
    inp.id = "username"
    inp.placeholder = "lokal"

    row.append(inp)
})

addField("Display Name:", (row) => {
    const inp = document.createElement("input")
    inp.id = "displayName"
    inp.placeholder = "Lokal"


    row.append(inp)
})

addField("Description:", (row) => {
    row.style.placeItems = "start"
    row.style.flexDirection = "column"
    const inp = document.createElement("textarea")
    inp.placeholder = "You should probably change this."
    inp.rows = 5;
    inp.id = "desc"
    inp.maxLength = "150"

    row.append(inp)

})

const preview = document.createElement("img")
preview.id = "pfp"
preview.classList.add("border")
preview.src = "../img/pfp.jpg"

modal.append(preview)



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

addField("Border Color:", (row) => {
    const inp = document.createElement("input")
    inp.type = "color"
    inp.id = "borderColor"
    inp.value = "#a353b9"
    inp.onchange = function () {
        preview.style.borderColor = inp.value
    }


    row.append(inp)
})

addButton("Cancel", () => {
    if (urlParams.get("createGroup")) {
        window.location.href = "../"
        return
    }
    window.location.href = "../user/index.html?u=" + oldUsername
})



modal.append(buttons)

content.append(modal)

let oldUsername = ""
let u = undefined

if (urlParams.get("u")) {

    const uid = await User.getUID(urlParams.get("u"))

    u = new User(uid)

    const pub = await u.getData("public")
    oldUsername = await u.getUsername()

    document.getElementById("username").value = oldUsername

    document.getElementById("displayName").value = pub.displayName

    document.getElementById("desc").value = pub.desc


    if (pub.pfp) {
        preview.src = pub.pfp
    }

    if (pub.accentColor) {
        preview.style.borderColor = pub.accentColor

        document.getElementById('borderColor').value = rgbToHex(pub.accentColor)
    }


}

addButton("Done", async () => {
    const usernameVal = document.getElementById("username").value
    const displayNameVal = document.getElementById("displayName").value
    const data = {

        displayName: displayNameVal,
        desc: document.getElementById("desc").value,
        pfp: document.getElementById("pfp").src,
        accentColor: preview.style.borderColor

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

    if (urlParams.get("createGroup")) {
        const newUser = await User.createUser(usernameVal, data, {}, { group: true })

        newUser.updateMember(auth.currentUser.uid, { admin: true, accepted: true })
    }
    else {

        await u.updateUsername(usernameVal)

        await u.updateData(data, "public")
    }



    window.location.href = "../user/index.html?u=" + document.getElementById("username").value
})