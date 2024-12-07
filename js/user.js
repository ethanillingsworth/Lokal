import { getDoc, doc, query, collection, getDocs, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { User, displayEvent } from "./funcs.js";

const urlParams = new URLSearchParams(window.location.search);

const pageUser = urlParams.get("u")

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")

const top = document.createElement("div")
top.classList.add("row")
top.id = "top"
top.style.width = "100%"
top.style.placeContent = "start"

const pfp = document.createElement("img")
pfp.src = "../img/pfp.jpg"
pfp.id = "pfp"
pfp.classList.add("border")

const userDetails = document.createElement("div")
userDetails.classList.add("col")
userDetails.id = "userDetails"


const displayName = document.createElement("h2");
displayName.innerText = "Loading..."
displayName.id = "displayName"
displayName.style.marginRight = "10px"



const usrname = document.createElement("h3");
usrname.innerText = "Loading..."
usrname.id = "username"

const badges = document.createElement("div")
badges.classList.add("row")
badges.style.flexWrap = "nowrap"
badges.style.placeContent = "start"
badges.style.marginTop = "10px"

function addBadge(label) {
    const badge = document.createElement("h4")
    badge.innerText = label
    badge.classList.add("badge")

    badges.append(badge)

    return badge
}

const desc = document.createElement("p");

desc.innerText = "Loading..."

const tabs = document.createElement("div")

tabs.classList.add("row")
tabs.classList.add("tabList")

tabs.style.gap = "20px"
tabs.style.marginBottom = "0"
tabs.style.marginTop = "20px"
tabs.style.position = "relative"
tabs.style.top = "10px"

function createTab(name, current) {
    const tab = document.createElement("h4")
    tab.classList.add("tab")
    if (current) tab.classList.add("current")

    tab.innerText = name

    tabs.append(tab)

    const pageContent = document.createElement("div")
    pageContent.classList.add("pageContent")
    pageContent.id = name
    if (current) pageContent.classList.add("currentPage")


    tab.onclick = function () {

        document.querySelectorAll(".pageContent").forEach((c) => {
            c.classList.remove("currentPage")
        })

        document.querySelectorAll(".tab").forEach((t) => {
            t.classList.remove("current")
        })
        tab.classList.add("current")
        document.getElementById(name).classList.add("currentPage")

    }

    modal.append(pageContent)


}

const divider = document.createElement("hr")


top.append(pfp)

userDetails.append(displayName)
userDetails.append(usrname)
userDetails.append(badges)
userDetails.append(desc)

top.append(userDetails)


modal.append(top)
modal.append(tabs)
modal.append(divider)



content.append(modal)

createTab("Hosting", true)
createTab("Attending")

async function hosting(uid) {
    const hostingTab = document.getElementById("Hosting")

    const q = query(collection(db, "posts"), where("creator", "==", uid))

    const get = await getDocs(q)

    get.forEach(async (event) => {
        await displayEvent(event.id, hostingTab)
    })
}

async function uDataStuff(uid) {
    const attendingTab = document.getElementById("Attending")

    const q = query(collection(db, "posts"))

    const get = await getDocs(q)

    get.forEach(async (event) => {

        const uData = await getDoc(doc(db, "posts", event.id, "uData", uid))
        if (uData.exists()) {
            const data = uData.data()
            // check if user is attending
            if (data.attending) {
                await displayEvent(event.id, attendingTab)
            }
        }
    })
}


function updateProfile(data) {
    usrname.innerText = `(@${pageUser})`
    document.title = `Lokal - @${pageUser}`
    displayName.innerText = data.displayName

    desc.innerText = data.desc.replaceAll("<br>", "\n")

    if (data.pfp) {
        document.getElementById("pfp").src = data.pfp
    }




}

const uid = await User.getUID(pageUser)
const user = new User(uid)

const meta = await user.getData("hidden")

if (meta.admin) {
    const adminBadge = addBadge("Admin")

    adminBadge.style.backgroundColor = "var(--accent)"
}

onAuthStateChanged(auth, async (u) => {

    if (u.uid == uid || meta.admin) {
        const edit = document.createElement("img")
        edit.id = "edit"
        edit.src = "../img/icons/edit.png"
        edit.style.marginLeft = "auto"
        edit.width = "35"


        edit.onclick = function () {
            window.location.href = "../edit/index.html?u=" + urlParams.get("u")

        }

        top.append(edit)
    }
})

// get actual data
const data = await user.getData("public")

updateProfile(data)
await hosting(uid)
await uDataStuff(uid)


