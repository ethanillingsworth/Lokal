import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

import { CustomItem, Utils, Item, Menu, Sidebar, User } from "./funcs.js";


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

sidebar.menu.addItem(new Item("Events", "../img/icons/party.png", "../"))

sidebar.menu.addItem(new Item("Group Finder", "../img/icons/groupfinder.png", "../groupfinder"))

$(document.body).append(content)


//addItem("Home", "../img/icons/home.png", "../")

onAuthStateChanged(auth, async (user) => {


    const searchMenu = new Menu(expand)

    const searchBar = new CustomItem(`
        <div class= "row" style = "gap: 0px; flex-wrap: nowrap; place-items: center; width: 100%;" >
            <input placeholder="Search" id="search"></input>
            <div id="search-icon">
                <img src="../img/icons/search.png" style="margin: 0;">
            </div>
        </div>`,
        () => {

            document.getElementById("search-icon").onclick = async function () {
                if (document.getElementById('search').value) {
                    const s = document.getElementById('search').value.replaceAll('-', '\-').replaceAll(' ', '-')
                    // if (user) {
                    //     await updateDoc(doc(db, "users", uid, "data", "private"), {
                    //         "prevRes": arrayUnion(s)
                    //     });
                    // }
                    window.location.href = '../search/index.html?q=' + s

                }
            }
        })

    searchBar.noHover = true

    searchMenu.addItem(searchBar)

    if (!user) {
        console.log(1)
        window.location.href = "../login"
        return
    }
    else {

        const uid = user.uid;

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

        sidebar.menu.addItem(new Item("Search", "../img/icons/search.png", searchMenu))

        // const notifMenu = new Menu(expand)

        // sidebar.menu.addItem(new Item("Notifications", "../img/icons/notif.png", notifMenu))

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

        function resizeChecks() {
            if (window.innerWidth < 512) {
                sidebar.setHeading("L")

                if (!backAdded) {

                    moreMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)

                    searchMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.removeClass("showExpand")
                        Menu.clicked = false
                    }), true)
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

        const q = query(collection(db, "users"), where("badges", "array-contains", "group"))

        const groups = await getDocs(q)

        groups.forEach(async g => {
            const group = new User(g.id)

            const readOnly = await group.getMemberReadOnly(uid)

            if (readOnly.admin) {
                // show item
                const pub = await group.getData("public")
                const username = await group.getUsername()

                const item = new Item(pub.displayName, "../img/pfp.jpg", `../user/index.html?u=${username}`)

                if (pub.pfp) {
                    item.img = pub.pfp
                }
                item.classList = ["user-side"]

                sidebar.menu.addItem(item, true)
            }

        });

    }


});


document.querySelectorAll("label").forEach((e) => {
    document.getElementById(e.htmlFor).click()
})

