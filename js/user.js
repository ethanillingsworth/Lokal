import { getDoc, doc, query, collection, getDocs, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { User, createBadge, displayEvent } from "./funcs.js";

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
userDetails.gap = "20px"

const nameDiv = document.createElement("div")
nameDiv.classList.add("row")
nameDiv.style.placeContent = "start"
nameDiv.style.placeItems = "center"



const displayName = document.createElement("h2");
displayName.innerText = "Loading..."
displayName.id = "displayName"


const usrname = document.createElement("h3");
usrname.innerText = "Loading..."
usrname.id = "username"

nameDiv.append(displayName)
nameDiv.append(usrname)


const badges = document.createElement("div")
badges.classList.add("row")
badges.style.flexWrap = "nowrap"
badges.style.placeContent = "start"


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


const tools = document.createElement("div")
tools.classList.add("row")
tools.classList.add('tools')

top.append(pfp)


userDetails.append(nameDiv)
userDetails.append(badges)
userDetails.append(desc)

top.append(userDetails)



modal.append(top)
modal.append(tools)
modal.append(tabs)
modal.append(divider)

content.append(modal)

createTab("Hosting", true)

async function hosting(uid) {
    const hostingTab = document.getElementById("Hosting")

    const q = query(collection(db, "posts"), where("creator", "==", uid))

    const get = await getDocs(q)

    get.forEach(async (event) => {
        await displayEvent(event.id, hostingTab)
    })
}

async function attending(uid) {
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
    const adminBadge = createBadge("Admin")


    adminBadge.style.backgroundColor = "var(--accent)"

    badges.append(adminBadge)
}

if (meta.partner) {
    const adminBadge = createBadge("Partner")


    adminBadge.style.backgroundColor = "var(--accent2)"

    badges.append(adminBadge)
}

if (meta.group) {
    const groupBadge = createBadge("Group")

    groupBadge.style.backgroundColor = "#3577d4"

    badges.append(groupBadge)
}

onAuthStateChanged(auth, async (u) => {

    const currentUser = new User(u.uid)

    const metaU = await currentUser.getData("hidden")

    if (u.uid == uid || metaU.admin) {
        const edit = document.createElement("img")
        edit.id = "edit"
        edit.src = "../img/icons/edit.png"
        edit.style.marginLeft = "auto"
        edit.width = "35"

        tools.append(edit)


        edit.onclick = function () {
            window.location.href = "../edit/index.html?u=" + urlParams.get("u")

        }
    }
})

// get actual data
const data = await user.getData("public")

updateProfile(data)
await hosting(uid)

if (!meta.group) {
    createTab("Attending")
    await attending(uid)
}


