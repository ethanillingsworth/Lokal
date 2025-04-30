import { CustomItem, Utils, Item, Menu, Sidebar, User, Update, CSS } from "./funcs.js";

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { query, where, getDocs, collection, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";


window.getVersion = function () {
    return Utils.getVersion()
}

window.getSchool = function () {
    // Get the full path like "/eghs/events"
    const path = window.location.pathname;

    // Split it into parts: ["", "eghs", "events"]
    const parts = path.split('/');

    // Get the second part (index 1), which is the school code
    const school = parts[1];

    return school
}

const expand = $("<div/>").attr("id", "expand")

$(document.body).append(expand)

const content = $("<div/>").attr("id", "content")

const sidebar = new Sidebar()

function resizeChecks() {
    if (window.innerWidth < 600) {
        sidebar.setHeading("L")
    }
    else {
        sidebar.setHeading("Lokal")
    }
}


document.body.onresize = function () {

    resizeChecks()
}

resizeChecks()

sidebar.menu.addItem(new Item("Events Feed", "/img/icons/party.png", `/${window.getSchool()}/events`))

sidebar.menu.addItem(new Item("Group Finder", "/img/icons/groupfind.png", `/${window.getSchool()}/groupfinder`))

$(document.body).append(content)

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "/login"
        return
    }
    else {

        const uid = user.uid;

        await setDoc(doc(db, "emails", uid), {
            email: user.email
        }, { merge: true });

        const u = new User(uid)

        const username = await u.getUsername()


        const meta = await u.getData("hidden")

        let badges = []

        if (meta.badges) badges = meta.badges


        const pub = await u.getData("public")

        const notifMenu = new Menu(expand)

        notifMenu.expandedSize = "2"

        const notifs = await u.getNotifs()

        const it = new Item("Nothing to see here...", "", "")
        it.noHover = true
        notifMenu.addItem(it)

        notifs.forEach(async (n) => {
            const data = n.data()

            it.classList.push("hide-item")

            const group = new User(data.groupId)
            const username = await group.getUsername()
            const pub = await group.getData("public")

            window.removeNotif = async function (notifId) {
                await u.removeNotif(notifId)

                const i = notifMenu.items.findIndex((v) => v.id == notifId)

                notifMenu.items.splice(i, 1)
            }

            const ev = new CustomItem(`<img class="pfp border" style="border-radius: 7.5px; margin: 0" src="${await group.getPfp()}">
            <div class="event-content">
            
                <div class="user-info row" style="gap: 5px; place-items: center">
                    <h4 class="display-name">${pub.displayName}</h4>
                    <h4 class="username">(@${username})</h4>

                </div>
                <div class="row badges" style="display: none"></div>
                <h4>${data.message.subject}</h4>
                <p>
                    ${data.message.text}
                </p>
                <div class="row tools" style="place-content: end; gap: 5px;">
                    <img src="/img/icons/x.png" style="width: 25px; height: 25px; margin: 0" onclick="removeNotif('${n.id}')">
                    <img src="/img/icons/right.png" style="width: 25px; height: 25px; margin: 0" onclick="window.location.href = '${data.url}'">
                </div>
            </div>`, () => { })

            ev.classList.push("event")
            ev.id = n.id

            notifMenu.addItem(ev)


        })

        sidebar.menu.addItem(new Item("Notifications", "/img/icons/notif.png", notifMenu))
        notifMenu.refresh()
        const email = await u.getEmail()
        if (!badges.includes("premium") && email.endsWith("@d214.org")) {
            const upgrade = new Item("Upgrade", "/img/icons/hat.png", "/plans")

            upgrade.classList = ['upgrade']
            sidebar.menu.addItem(upgrade)
        }


        // sidebar.menu.addItem(new Item("Host", "/img/icons/plus.png", "/host"))

        const moreMenu = new Menu(expand)

        moreMenu.addItem(new Item("Log Out", "/img/icons/logout.png", () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                window.location.href = "/login?r=" + window.location.href

            }).catch((error) => {
                // An error happened.
            });
        }), true)

        if (badges.includes("premium") || badges.includes("admin")) {
            moreMenu.addItem(new Item("Create Group", "/img/icons/addgroup.png", `/${window.getSchool()}/edit?createGroup=true`), true)
            moreMenu.addItem(new Item("Organizer Guide", "/img/icons/doc.png", "/org-guide"), true)
        }

        let backAdded = false

        const groupMenu = new Menu(expand)

        function resizeChecks() {
            if (window.innerWidth <= 600) {
                sidebar.setHeading("L")

                if (!backAdded) {

                    moreMenu.addItem(new Item("Back", "/img/icons/left.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
                    notifMenu.addItem(new Item("Back", "/img/icons/left.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
                    groupMenu.addItem(new Item("Back", "/img/icons/left.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
                    backAdded = true
                }
            }
            else {
                sidebar.setHeading("Lokal")
            }
        }


        document.body.onresize = function () {

            resizeChecks()
        }

        resizeChecks()


        sidebar.menu.addItem(new Item("More", "/img/icons/more.png", moreMenu), true)

        const dName = new Item(pub.displayName, "/img/pfp.jpg", `/${window.getSchool()}/user/${username}`)

        dName.img = await u.getPfp()

        dName.classList = ["user-side"]

        sidebar.menu.addItem(dName, true)


        sidebar.menu.addItem(new Item("Your Groups", "/img/icons/groups.png", groupMenu), true)

        const q = query(collection(db, "schools", window.getSchool(), "users"), where("badges", "array-contains", "group"))

        const groups = await getDocs(q)

        for (const g of groups.docs) {
            const group = new User(g.id)

            const mem = await group.getMember(uid)
            const memReadOnly = await group.getMemberReadOnly(uid)


            if (mem.joined && memReadOnly.accepted) {
                // show item
                const pub = await group.getData("public")
                const username = await group.getUsername()

                const item = new Item(pub.displayName, "/img/pfp.jpg", `/${window.getSchool()}/user/${username}`)


                item.img = await group.getPfp()

                item.classList = ["user-side"]

                groupMenu.addItem(item)
            }
        }

    }


});

document.querySelectorAll("label").forEach((e) => {
    document.getElementById(e.htmlFor).click()
})

