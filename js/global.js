import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { auth } from "./firebase.js";

import { CustomItem, Utils, Item, Menu, Sidebar, User } from "./funcs.js";


// debug only version
// const ver = document.createElement("span")
// ver.id = "ver"
// ver.innerText = "BETA v1"
// document.body.append(ver)

window.getVersion = function () {
    return Utils.getVersion()
}

// elements

const expand = document.createElement("div")
expand.id = "expand"

document.body.append(expand)

const bottom = document.createElement("div")
bottom.id = "bottom"

const content = document.createElement("div")
content.id = "content"

const sidebar = new Sidebar()

function resizeChecks() {
    if (window.innerWidth < 512) {
        sidebar.heading.innerText = "L"
    }
    else {
        sidebar.heading.innerText = "Lokal"
    }
}


document.body.onresize = function () {

    resizeChecks()
}

resizeChecks()

sidebar.menu.addItem(new Item("Connect", "../img/icons/party.png", "../"))

document.body.append(content)


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

        sidebar.menu.addItem(new Item("Search", "../img/icons/search.png", searchMenu))


        const dName = new Item("Sign in", "../img/pfp.jpg", () => {
            window.location.href = "../login"
        })
        dName.id = "user"

        sidebar.menu.addItem(dName, true)


    }
    else {

        const uid = user.uid;

        const u = new User(uid)

        // createEvent(uid, "Sports", "Verrat de marde de mosus de doux Jésus de charrue de saint-ciboire de sacristi de crucifix de colon d'étole de maudite marde.", new Date(), "Elk Grove High School", 0, [])

        const username = await u.getUsername()


        const meta = await u.getData("hidden")

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

        // sidebar.menu.addItem(new Item("Host", "../img/icons/plus.png", "../host"))
        if (meta.approved) {
            sidebar.menu.addItem(new Item("Create Group", "../img/icons/group.png", "../edit/index.html?createGroup=true"))
        }

        const dName = new Item(pub.displayName, "../img/pfp.jpg", `../user/index.html?u=${username}`)

        if (pub.pfp) {
            dName.img = pub.pfp
        }
        dName.id = "user"

        sidebar.menu.addItem(dName, true)

        const moreMenu = new Menu(expand)

        moreMenu.addItem(new Item("Log Out", "../img/icons/logout.png", () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                location.href = "../login/index.html?r=" + window.location.href

            }).catch((error) => {
                // An error happened.
            });
        }), true)

        let backAdded = false

        function resizeChecks() {
            if (window.innerWidth < 512) {
                sidebar.heading.innerText = "L"

                if (!backAdded) {

                    moreMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.classList.remove("showExpand")
                        Menu.clicked = false
                    }), true)

                    searchMenu.addItem(new Item("Back", "../img/icons/back.png", () => {
                        expand.classList.remove("showExpand")
                        Menu.clicked = false
                    }), true)
                }
            }
            else {
                sidebar.heading.innerText = "Lokal"
            }
        }


        document.body.onresize = function () {

            resizeChecks()
        }

        resizeChecks()

        sidebar.menu.addItem(new Item("More", "../img/icons/more.png", moreMenu), true)

    }


});


document.querySelectorAll("label").forEach((e) => {
    document.getElementById(e.htmlFor).click()
})

