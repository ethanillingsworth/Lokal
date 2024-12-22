import { getDoc, doc, query, collection, getDocs, where, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { User, Badge, Event } from "./funcs.js";

import "./jquery.js";

const urlParams = new URLSearchParams(window.location.search);
const pageUser = urlParams.get("u");

const content = $("#content");

// Modal
const modal = $("<div/>").addClass("modal");

// Top row
const top = $("<div/>")
    .addClass("row")
    .attr("id", "top")
    .css("width", "100%")
    .css("place-content", "start");

const pfp = $("<img/>")
    .attr("src", "../img/pfp.jpg")
    .attr("id", "pfp")
    .addClass("border");

// User Details
const userDetails = $("<div/>")
    .addClass("col")
    .attr("id", "userDetails")
    .css("gap", "20px");

// Name Div
const nameDiv = $("<div/>")
    .addClass("row")
    .css("place-content", "start")
    .css("place-items", "center")
    .css("gap", "5px");

const displayName = $("<h2/>")
    .text("Loading...")
    .attr("id", "displayName");

const usrname = $("<h3/>")
    .text("Loading...")
    .attr("id", "username");

nameDiv.append(displayName).append(usrname);

const badges = $("<div/>")
    .addClass("row")
    .css("flex-wrap", "nowrap")
    .css("place-content", "start");

const desc = $("<p/>").text("Loading...");

const join = $("<button/>")
    .text("Join")
    .css("width", "fit-content")
    .css("display", "none");

const tabs = $("<div/>")
    .addClass("row tabList")
    .css("gap", "20px")
    .css("margin-bottom", "0")
    .css("margin-top", "20px")
    .css("position", "relative")
    .css("top", "10px");

// Tab Creation Function
function createTab(name, current) {
    const tab = $("<h4/>")
        .addClass("tab")
        .text(name);

    if (current) tab.addClass("current");

    tabs.append(tab);

    const pageContent = $("<div/>")
        .addClass("pageContent")
        .attr("id", name);

    if (current) pageContent.addClass("currentPage");

    tab.on("click", function () {
        $(".pageContent").removeClass("currentPage");
        $(".tab").removeClass("current");

        tab.addClass("current");
        $(`#${name}`).addClass("currentPage");
    });

    modal.append(pageContent);
}

const divider = $("<hr/>");

const tools = $("<div/>").addClass("row tools");

top.append(pfp);
userDetails.append(nameDiv).append(badges).append(desc).append(join);
top.append(userDetails);

modal.append(top).append(tools).append(tabs).append(divider);

content.append(modal);


async function hosting(uid) {
    const hostingTab = $("#Hosting")

    const q = query(collection(db, "posts"), where("creator", "==", uid))

    const get = await getDocs(q)

    get.forEach(async (event) => {
        const e = new Event(event.id)
        await e.display(hostingTab)
    })
}

async function attending(uid) {
    const attendingTab = $("#Attending")

    const q = query(collection(db, "posts"))

    const get = await getDocs(q)

    get.forEach(async (event) => {

        const uData = await getDoc(doc(db, "posts", event.id, "uData", uid))

        const e = new Event(event.id)

        if (uData.exists()) {
            const data = uData.data()
            // check if user is attending
            if (data.attending) {
                await e.display(attendingTab)
            }
        }
    })
}

// still needs to be updated for JQ
async function members(user) {
    const tab = $("#Members")

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

        let currentUser = new User("notloggedin")

        if (auth.currentUser) currentUser = new User(auth.currentUser.uid)

        const currentUserMeta = await currentUser.getData("hidden")

        let memData = {}

        if (auth.currentUser) memData = await user.getMember(auth.currentUser.uid)

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
    const tab = $("#Groups")

    const groupQ = query(collection(db, "users"), where("group", "==", true))

    const groups = await getDocs(groupQ)

    groups.forEach(async (g) => {
        const group = new User(g.id)

        const username = await group.getUsername()

        const pub = await group.getData("public")
        const meta = await group.getData("hidden")


        if (Object.keys(await group.getMember(user.uid)).length != 0) {
            await User.display(username, pub, meta, tab)
        }
    })

}

// still needs to be updated for JQ
async function requests(user) {
    const tab = $("#Requests")

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
    $("#username").text(`(@${pageUser})`);
    document.title = `Lokal - @${pageUser}`;
    displayName.text(data.displayName);

    desc.text(data.desc.replaceAll("<br>", "\n"));

    if (data.pfp) {
        $("#pfp").attr("src", data.pfp);
    }

    if (data.accentColor) {
        $("#pfp").css("border-color", data.accentColor);
    }

}

const uid = await User.getUID(pageUser)
const user = new User(uid)

const meta = await user.getData("hidden")


if (meta.admin) {
    const adminBadge = new Badge("Lokal Staff")


    adminBadge.css("backgroundColor", "var(--accent)")


    badges.append(adminBadge)
}

if (meta.partner) {
    const adminBadge = new Badge("Partner")

    adminBadge.css("backgroundColor", "var(--accent2)")

    badges.append(adminBadge)
}

if (meta.group) {
    const groupBadge = new Badge("Group")

    groupBadge.css("backgroundColor", "#3577d4")

    badges.append(groupBadge)
}

onAuthStateChanged(auth, async (u) => {

    if (!u) {
        return
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

if (!meta.group) {
    createTab("Attending", true)
    await attending(uid)

    createTab("Groups")

    await groups(user)
}
else {
    createTab("Hosting", true)
    await hosting(uid)
    createTab("Members")
    await members(user)

}


