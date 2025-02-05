import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { query, where, getDocs, collection, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

import { CustomItem, Utils, Item, Menu, Sidebar, User, Update } from "./funcs.js";


// debug only version
// const ver = document.createElement("span")
// ver.id = "ver"
// ver.innerText = "BETA v1"
// document.body.append(ver)

window.getVersion = function () {
    return Utils.getVersion()
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

sidebar.menu.addItem(new Item("Events Feed", "../img/icons/party.png", "../"))

sidebar.menu.addItem(new Item("Group Finder", "../img/icons/groupfind.png", "../groupfinder"))

$(document.body).append(content)


//addItem("Home", "../img/icons/home.png", "../")

onAuthStateChanged(auth, async (user) => {


    // const searchMenu = new Menu(expand)

    // const searchBar = new CustomItem(`
    //     <div class= "row" style = "gap: 0px; flex-wrap: nowrap; place-items: center; width: 100%;" >
    //         <input placeholder="Search" id="search"></input>
    //         <div id="search-icon">
    //             <img src="../img/icons/search.png" style="margin: 0;">
    //         </div>
    //     </div>`,
    //     () => {

    //         document.getElementById("search-icon").onclick = async function () {
    //             if (document.getElementById('search').value) {
    //                 const s = document.getElementById('search').value.replaceAll('-', '\-').replaceAll(' ', '-')
    //                 // if (user) {
    //                 //     await updateDoc(doc(db, "users", uid, "data", "private"), {
    //                 //         "prevRes": arrayUnion(s)
    //                 //     });
    //                 // }
    //                 window.location.href = '../search/index.html?q=' + s

    //             }
    //         }
    //     })

    // searchBar.noHover = true

    // searchMenu.addItem(searchBar)

    if (!user) {
        window.location.href = "../login"
        return
    }
    else {

        const uid = user.uid;

        await setDoc(doc(db, "emails", uid), {
            email: user.email
        });

        const u = new User(uid)

        // createEvent(uid, "Sports", "Verrat de marde de mosus de doux Jésus de charrue de saint-ciboire de sacristi de crucifix de colon d'étole de maudite marde.", new Date(), "Elk Grove High School", 0, [])

        const username = await u.getUsername()


        const meta = await u.getData("hidden")

        let badges = []

        if (meta.badges) badges = meta.badges

        // prev searches
        // if (priv.prevRes) {
        //     let count = 0
        //     priv.prevRes.reverse().forEach(res => {
        //         if (count <= 10) {

        //             searchMenu.addItem(new Item(res, "../img/icons/prev.png", `../search/index.html?q=${res.replaceAll("-", "\-").replaceAll(" ", "-")}`))

        //         }
        //         count++
        //     })
        // }

        const pub = await u.getData("public")

        // sidebar.menu.addItem(new Item("Search", "../img/icons/search.png", searchMenu))

        const notifMenu = new Menu(expand)

        const notifs = await u.getNotifs()

        notifs.forEach(async (n) => {
            const data = n.data()

            const group = new User(data.groupId)
            const username = await group.getUsername()
            const pub = await group.getData("public")

            window.removeNotif = async function (notifId) {
                await u.removeNotif(notifId)

                const i = notifMenu.items.findIndex((v) => v.id == notifId)

                notifMenu.items.splice(i, 1)
            }

            const ev = new CustomItem(`<img class="pfp border" src="../img/pfp.jpg">
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
                <div class="row tools" style="place-content: end; gap:0;">
                    <img src="../img/icons/x.png" style="width: 25px; height: 25px;" onclick="removeNotif('${n.id}')">
                    <img src="../img/icons/arrow.png" style="width: 25px; height: 25px;" onclick="window.location.href = '${data.url}'">
                </div>
            </div>`, () => { })

            ev.classList.push("event")
            ev.id = n.id

            notifMenu.addItem(ev)


        })

        sidebar.menu.addItem(new Item("Notifications", "../img/icons/notif.png", notifMenu))

        if (!badges.includes("premium")) {
            const upgrade = new Item("Upgrade", "../img/icons/hat.png", "../plans")

            upgrade.classList = ['upgrade']
            sidebar.menu.addItem(upgrade)
        }


        // sidebar.menu.addItem(new Item("Host", "../img/icons/plus.png", "../host"))

        const moreMenu = new Menu(expand)


        moreMenu.addItem(new Item("Log Out", "../img/icons/logout.png", () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                window.location.href = "../login/index.html?r=" + window.location.href

            }).catch((error) => {
                // An error happened.
            });
        }), true)

        if (badges.includes("premium") || badges.includes("admin")) {
            moreMenu.addItem(new Item("Create Group", "../img/icons/group.png", "../edit/index.html?createGroup=true"), true)
        }

        let backAdded = false

        const groupMenu = new Menu(expand)

        function resizeChecks() {
            if (window.innerWidth < 600) {
                sidebar.setHeading("L")

                if (!backAdded) {

                    moreMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
                    notifMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
                    groupMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
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


        sidebar.menu.addItem(new Item("More", "../img/icons/more.png", moreMenu), true)

        const dName = new Item(pub.displayName, "../img/pfp.jpg", `../user/index.html?u=${username}`)

        if (pub.pfp) {
            dName.img = pub.pfp
        }
        dName.classList = ["user-side"]

        sidebar.menu.addItem(dName, true)


        sidebar.menu.addItem(new Item("Your Groups", "../img/icons/groupfinder.png", groupMenu), true)

        const q = query(collection(db, "users"), where("badges", "array-contains", "group"))

        const groups = await getDocs(q)

        groups.forEach(async g => {
            const group = new User(g.id)

            const mem = await group.getMember(uid)


            if (mem.joined) {
                // show item
                const pub = await group.getData("public")
                const username = await group.getUsername()

                const item = new Item(pub.displayName, "../img/pfp.jpg", `../user/index.html?u=${username}`)

                if (pub.pfp) {
                    item.img = pub.pfp
                }
                item.classList = ["user-side"]

                groupMenu.addItem(item)
            }

        });

        if (notifMenu.items.length < 1) {
            const it = new Item("Nothing to see here...", "", "")
            it.noHover = true
            notifMenu.addItem(it)
        }

    }


});


document.querySelectorAll("label").forEach((e) => {
    document.getElementById(e.htmlFor).click()
})

