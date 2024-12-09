import { getDoc, doc, query, collection, getDocs, where, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { User, Badge, displayEvent } from "./funcs.js";

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

nameDiv.style.gap = "5px"

const badges = document.createElement("div")
badges.classList.add("row")
badges.style.flexWrap = "nowrap"
badges.style.placeContent = "start"


const desc = document.createElement("p");

desc.innerText = "Loading..."

const join = document.createElement("button")

join.innerText = "Join"

join.style.width = "fit-content"
join.style.display = "none"


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
userDetails.append(join)

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

async function members(user) {
    const tab = document.getElementById("Members")

    const q = query(collection(db, "users", user.uid, "members"), where("accepted", "==", true), limit(25))

    const get = await getDocs(q)

    get.forEach(async (person) => {
        const personClass = new User(person.id)

        const username = await personClass.getUsername()
        const pub = await personClass.getData("public")
        const meta = await personClass.getData("hidden")

        let admin = false

        if (person.data().admin) { admin = true }

        const dis = await User.display(username, pub, meta, tab, admin)

        const currentUser = new User(auth.currentUser.uid)

        const currentUserMeta = await currentUser.getData("hidden")

        const memData = await user.getMember(auth.currentUser.uid)

        if (currentUserMeta.admin || memData.admin) {

            const actions = dis.querySelector(".actions")

            actions.innerHTML = ""

            let p = true

            const promote = document.createElement("img")
            if (!admin) {
                promote.src = "../img/icons/up.png"
            }
            else {
                promote.src = "../img/icons/down.png"
                p = false

            }
            promote.classList.add("action")
            promote.onclick = async function () {


                if (p) {
                    if (confirm("Are you sure you want to promote that person?")) {
                        await user.updateMember(person.id, { admin: true })
                    }
                    p = false
                    promote.src = "../img/icons/down.png"



                }
                else {
                    if (confirm("Are you sure you want to demote that person?")) {
                        await user.updateMember(person.id, { admin: false })
                    }
                    p = true
                    promote.src = "../img/icons/up.png"

                }
            }

            const del = document.createElement("img")
            del.src = "../img/icons/del.png"
            del.classList.add("action")
            del.onclick = async function () {
                if (confirm("Are you sure you want to remove that person from your group?")) {
                    await user.updateMember(person.id, { pending: false, accepted: false })
                    actions.parentElement.remove()
                }
            }

            const open = document.createElement("img")
            open.src = "../img/icons/arrow.png"
            open.classList.add("action")
            open.onclick = async function () {
                window.location.href = "../user/index.html?u=" + username
            }

            if (auth.currentUser.uid != personClass.uid) {
                actions.append(promote)
                actions.append(del)

            }

            actions.append(open)
        }
    })
}


async function groups(user) {
    const tab = document.getElementById("Groups")

    const groupQ = query(collection(db, "users"), where("group", "==", true))

    const groups = await getDocs(groupQ)

    groups.forEach(async (g) => {
        const group = new User(g.id)

        const username = await group.getUsername()

        const pub = await group.getData("public")
        const meta = await group.getData("hidden")


        if (await group.getMember(user.uid) != {}) {
            await User.display(username, pub, meta, tab)
        }
    })

}

async function requests(user) {
    const tab = document.getElementById("Requests")

    const q = query(collection(db, "users", user.uid, "members"), where("pending", "==", true), limit(25))

    const get = await getDocs(q)



    get.forEach(async (person) => {
        const personClass = new User(person.id)

        const username = await personClass.getUsername()
        const pub = await personClass.getData("public")
        const meta = await personClass.getData("hidden")


        const dis = await User.display(username, pub, meta, tab)

        const actions = dis.querySelector(".actions")

        actions.innerHTML = ""

        const confirm = document.createElement("img")
        confirm.src = "../img/icons/confirm.png"
        confirm.classList.add("action")
        confirm.onclick = async function () {
            await user.updateMember(person.id, { pending: false, accepted: true })
            actions.parentElement.remove()
        }

        actions.append(confirm)
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

    if (data.accentColor) {
        document.getElementById("pfp").style.borderColor = data.accentColor
    }

}

const uid = await User.getUID(pageUser)
const user = new User(uid)

const meta = await user.getData("hidden")


if (meta.admin) {
    const adminBadge = new Badge("Lokal Staff")


    adminBadge.style.backgroundColor = "var(--accent)"

    badges.append(adminBadge)
}

if (meta.partner) {
    const adminBadge = new Badge("Partner")

    adminBadge.style.backgroundColor = "var(--accent2)"

    badges.append(adminBadge)
}

if (meta.group) {
    const groupBadge = new Badge("Group")

    groupBadge.style.backgroundColor = "#3577d4"

    badges.append(groupBadge)
}

onAuthStateChanged(auth, async (u) => {

    if (!u) {
        window.location.href = "../"
    }

    const currentUser = new User(u.uid)

    const metaU = await currentUser.getData("hidden")

    const groupU = await user.getMember(u.uid)

    if ((u.uid == uid || metaU.admin) || (meta.group && groupU.admin)) {

        if (meta.group) {
            const addEvent = document.createElement("img")
            addEvent.src = "../img/icons/plus.png"

            addEvent.onclick = function () {
                window.location.href = "../host/index.html?u=" + user.uid
            }

            tools.append(addEvent)
        }

        const edit = document.createElement("img")
        edit.id = "edit"
        edit.src = "../img/icons/edit.png"
        edit.width = "35"

        tools.append(edit)


        edit.onclick = function () {
            window.location.href = "../edit/index.html?u=" + urlParams.get("u")

        }
    }

    if (meta.group) {
        const memberData = await user.getMember(currentUser.uid)


        if (memberData.pending) {
            join.classList.add("pending")
            join.innerText = "Pending..."
        }

        if (memberData.accepted) {

            join.innerText = "Joined"
        }

        if (memberData.admin || metaU.admin) {
            createTab("Requests")
            await requests(user)
        }
        if (!memberData.admin) {
            join.style.display = "flex"
        }

        join.onclick = async function () {
            if (join.innerText == "Join") {
                join.classList.add("pending")
                join.innerText = "Pending..."
                await user.updateMember(currentUser.uid, { pending: true })

            }
            else if (join.innerText == "Pending...") {
                join.classList.remove("pending")
                join.innerText = "Join"

                await user.updateMember(currentUser.uid, { pending: false })
            }
            else if (join.innerText == "Joined") {

                join.innerText = "Join"
                await user.updateMember(currentUser.uid, { pending: false, accepted: false })

            }
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

    createTab("Groups")

    await groups(user)
}
else {
    createTab("Members")
    await members(user)

}


