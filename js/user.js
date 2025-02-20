import { getDoc, doc, query, collection, getDocs, where, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import {
    User, Badge, Event, MoreMenu, Update, Calendar, CSS
} from "./funcs.js";

CSS.loadFiles(["../css/user.css"])


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
    .css("gap", "10px")
    .css("margin-bottom", "10px")
    .css("margin-top", "10px")
    .css("position", "relative")

// Tab Creation Function
function createTab(name, current) {
    const tab = $("<button/>")
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



// async function hosting(uid) {
//     const hostingTab = $("#Events")

//     const q = query(collection(db, "posts"), where("creator", "==", uid), orderBy("timestamp", "desc"))

//     const get = await getDocs(q)

//     if (data.pinnedEvent) {
//         const up = new Event(data.pinnedEvent)

//         await up.display(hostingTab, true)

//     }

//     get.forEach(async (event) => {
//         if (event.id != data.pinnedEvent) {
//             const u = new Event(event.id)
//             await u.display(hostingTab)
//         }
//     })
// }

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

async function members(user) {
    const tab = $("#Members")

    const q = query(collection(db, "users", user.uid, "members"), where("joined", "==", true), limit(25))

    const get = await getDocs(q)

    get.forEach(async (person) => {
        const personClass = new User(person.id)

        let readOnly = await user.getMemberReadOnly(person.id)

        let currentUserReadOnly = {}

        if (auth.currentUser) currentUserReadOnly = await user.getMemberReadOnly(auth.currentUser.uid)

        if (readOnly.accepted == false) return

        const username = await personClass.getUsername()
        const pub = await personClass.getData("public")
        const meta = await personClass.getData("hidden")


        let admin = false

        if (readOnly.admin) { admin = true }

        const dis = await User.display(username, pub, meta, tab, admin)

        let currentUser = new User("notloggedin")

        if (auth.currentUser) currentUser = new User(auth.currentUser.uid)

        const currentUserBadges = await currentUser.getBadges()


        if (currentUserBadges.includes('admin') || currentUserReadOnly.admin) {

            const actions = dis.find(".actions");
            actions.empty();

            let p = true;

            const promote = $("<img/>")
                .addClass("action")
                .attr("src", admin ? "../img/icons/down.png" : "../img/icons/up.png")
                .on("click", async function () {
                    if (p) {
                        if (confirm("Are you sure you want to promote that person?")) {
                            await user.updateMemberReadOnly(person.id, { admin: true });
                        }
                        p = false;
                        $(this).attr("src", "../img/icons/down.png");
                    } else {
                        if (confirm("Are you sure you want to demote that person?")) {
                            await user.updateMemberReadOnly(person.id, { admin: false });
                        }
                        p = true;
                        $(this).attr("src", "../img/icons/up.png");
                    }
                });

            const del = $("<img/>")
                .addClass("action")
                .attr("src", "../img/icons/del.png")
                .on("click", async function () {
                    if (confirm("Are you sure you want to remove that person from your group?")) {
                        await user.updateMember(person.id, { pending: false, joined: false });
                        await user.updateMemberReadOnly(person.id, { false: true })
                        actions.parent().remove();
                    }
                });

            const open = $("<img/>")
                .addClass("action")
                .attr("src", "../img/icons/arrow.png")
                .on("click", function () {
                    window.location.href = `../user/index.html?u=${username}`;
                });

            if (auth.currentUser.uid !== personClass.uid) {
                actions.append(promote).append(del);
            }

            actions.append(open);
        }
    })
}

async function groups(user) {
    const tab = $("#Groups")

    const groupQ = query(collection(db, "users"), where("badges", "array-contains", "group"))

    const groups = await getDocs(groupQ)

    groups.forEach(async (g) => {
        const group = new User(g.id)

        const username = await group.getUsername()

        const pub = await group.getData("public")
        const meta = await group.getData("hidden")
        const mem = await group.getMember(user.uid)


        if (mem.joined) {
            await User.display(username, pub, meta, tab)
        }
    })

}

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

        const actions = dis.find(".actions");
        actions.empty();

        const confirm = $("<img/>")
            .addClass("action")
            .attr("src", "../img/icons/confirm.png")
            .on("click", async function () {
                await user.updateMember(person.id, { pending: false, joined: true });
                await user.updateMemberReadOnly(person.id, { accepted: true })
                if (pub.notifs) {
                    await user.notifyMember(personClass.uid, "has accepted you into their group!", "View their page on Lokal below", `https://lokalevents.com/user/index.html?u=${await user.getUsername()}`)
                }
                actions.parent().remove();
            });

        actions.append(confirm);
    })
}

// const calendar = new Calendar()

// async function cal(user) {
//     const tab = $("#Calendar")

//     const q = query(collection(db, "posts"), where("creator", "==", user.uid))

//     const get = await getDocs(q)

//     get.forEach((post) => {
//         const d = post.data()

//         const splitDate = d.date.split("/")
//         calendar.addEvent(splitDate[2], splitDate[0], splitDate[1], post.id)
//     })

//     calendar.display(tab)
// }


const uid = await User.getUID(pageUser)
const user = new User(uid)

function updateProfile(data, pfp) {
    $("#username").text(`(@${pageUser})`);
    document.title = `Lokal - @${pageUser}`;
    displayName.text(data.displayName);




    desc.html(data.desc.replaceAll("\n", "<br>"));

    $("#pfp").attr("src", pfp);


    if (data.accentColor) {
        $("#pfp").css("border-color", data.accentColor);
    }

}


const pub = await user.getData("public")

let bds = await user.getBadges()

console.log(bds)

bds.forEach((badgeName) => {
    const badge = Badge.getFromName(badgeName)

    badges.append(badge)
})

onAuthStateChanged(auth, async (u) => {

    // if not logged in, do nothing
    if (!u) {
        return
    }

    const currentUser = new User(u.uid)



    let bdsU = await currentUser.getBadges()

    const readOnly = await user.getMemberReadOnly(currentUser.uid)

    if ((u.uid == uid || bdsU.includes("admin")) || (bds.includes("group") && readOnly.admin)) {


        const moreMenu = new MoreMenu()

        if (bds.includes("group")) {
            moreMenu.add("Add Event", () => {
                window.location.href = "../host/index.html?u=" + user.uid

            })

            moreMenu.add("Add Update", () => {
                window.location.href = "../host/index.html?mode=update&u=" + user.uid

            })
        }

        moreMenu.add("Edit Profile", () => {
            window.location.href = "../edit/index.html?u=" + urlParams.get("u")
        })

        if (pub.notifs) {
            moreMenu.add("Turn Off Notifications", async () => {
                await user.updateData({ notifs: false }, "public")
                alert("We've updated your notification preferences")
                location.reload()
            })
        }
        else {
            moreMenu.add("Turn On Notifications", async () => {
                await user.updateData({ notifs: true }, "public")
                alert("We've updated your notification preferences")
                location.reload()
            })
        }



        tools.append(moreMenu.more)
    }

    if (bds.includes("group")) {
        const memberData = await user.getMember(currentUser.uid)



        if (memberData.pending) {
            join.addClass("pending")
            join.text("Pending...")
        }

        if (readOnly.accepted && memberData.joined) {

            join.text("Joined")
        }

        if (readOnly.admin || bdsU.includes("admin")) {
            createTab("Requests")
            await requests(user)
        }

        if (!readOnly.admin) {
            join.css("display", "flex")
        }

        join.on("click", async function () {
            if (join.text() == "Join") {
                join.addClass("pending")
                join.text("Pending...")
                await user.updateMember(currentUser.uid, { pending: true })

            }
            else if (join.text() == "Pending...") {
                join.removeClass("pending")
                join.text("Join")

                await user.updateMember(currentUser.uid, { pending: false })
            }
            else if (join.text() == "Joined") {

                join.text("Join")
                await user.updateMember(currentUser.uid, { pending: false, joined: false })

            }
        })

    }
})

// get actual data
const data = await user.getData("public")
const profilePicture = await user.getPfp()

updateProfile(data, profilePicture)

async function feed(uid) {
    const feedTab = $("#Feed")

    if (data.pinnedEvent) {
        const up = new Event(data.pinnedEvent)

        await up.display(feedTab, true)

    }

    if (data.pinnedUpdate) {
        const up = new Update(data.pinnedUpdate)

        await up.display(feedTab, true)

    }

    console.log(uid)

    const updates = await getDocs(query(collection(db, "updates"), where("creator", "==", uid), orderBy("timestamp", "desc")))

    const events = await getDocs(query(collection(db, "posts"), where("creator", "==", uid), orderBy("timestamp", "desc")))

    const feed = []

    updates.forEach(async (update) => {
        if (update.id != data.pinnedUpdate) {
            const u = new Update(update.id)
            feed.push({ "value": u, "timestamp": update.data().timestamp })
        }
    })

    events.forEach(async (event) => {
        if (event.id != data.pinnedEvent) {
            const u = new Event(event.id)
            feed.push({ "value": u, "timestamp": event.data().timestamp })
        }
    })

    feed.sort((a, b) => { return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime() }).forEach(async (v) => {
        await v.value.display(feedTab)
    })
}

if (bds.includes("group")) {
    createTab("Feed", true)
    // createTab("Events")
    // createTab("Calendar")
    createTab("Members")

    await feed(uid)
    // await hosting(uid)
    // await cal(user)
    await members(user)
}
else {

    createTab("Attending", true)
    await attending(uid)

    createTab("Groups")

    await groups(user)

}


