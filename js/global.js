import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDoc, doc, setDoc, getDocs, updateDoc, collection, addDoc, Timestamp, arrayUnion, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

import { addItem,  } from "./funcs.js";


// debug only version
const ver = document.createElement("span")
ver.id = "ver"
ver.innerText = "BETA v1"
document.body.append(ver)

window.getVersion = function() {
    console.log(ver.innerText)
}

// elements
const sidebar = document.createElement("div")
sidebar.id = "sidebar"

document.body.append(sidebar)

const expand = document.createElement("div")
expand.id = "expand"

document.body.append(expand)

const bottom = document.createElement("div")
bottom.id = "bottom"

const heading = document.createElement("h1")

heading.innerText = "Lokal"
heading.id = "heading"

sidebar.append(heading)




const content = document.createElement("div")
content.id = "content"

document.body.append(content)



//addItem("Home", "../img/icons/home.png", "../")
addItem("Connect", "../img/icons/party.png", "../")


export function checkInCache(name, value, after) {
    if (!localStorage.getItem(name)) {
        localStorage.setItem(name, value)
    }
    if (after != null) after()

}

export function removeFromCache(name, after) {
    if (localStorage.getItem(name)) {
        localStorage.removeItem(name)
    }
    if (after != null) after()
}

export function clearCache() {
    localStorage.clear();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
          
        location.href = "../login/index.html?r=" + window.location.href

    } 
    const uid = user.uid;

    //createEvent(uid, "Sports", "Verrat de marde de mosus de doux Jésus de charrue de saint-ciboire de sacristi de crucifix de colon d'étole de maudite marde.", new Date(), "Elk Grove High School", 0, [])

    const username = await getDoc(doc(db, "usernames", uid))

    if (username.exists()) {
        const data = username.data()
        localStorage.setItem("username", data.username)
    }

    const data = await getDoc(doc(db, "users", uid))

    if (data.exists()) {
        console.log(data.data())
    }

    const priv = await getDoc(doc(db, "users", uid, "data", "private"))


    if (priv.exists()) {
        const data = priv.data()

        
        const prevRes = {
            searchArea: {
                params: {
                    hideImage: true,
                    hideLabel: true,
                    noHov: true,
                    customHtml: `
                        <div class="row" style="gap: 0px; flex-wrap: nowrap; place-items: center">
                            <input placeholder="Search" id="search"></input>
                            <div id="search-icon">
                                <img src="../img/icons/search.png" style="margin: 0;">
                            </div>
                        </div>
                    `,
                    afterFunc: () => {
                        
                        document.getElementById("search-icon").onclick = async function() {
                            if (document.getElementById('search').value) {
                                const s = document.getElementById('search').value.replaceAll('-', '\-').replaceAll(' ', '-')
                                await updateDoc(doc(db, "users", uid, "data", "private"), {
                                    "prevRes": arrayUnion(s)
                                });
                                window.location.href = '../search/index.html?q=' + s

                            }
                        }
                    }
                }
            }
        }

        if (data.prevRes) {
            let count = 0
            data.prevRes.reverse().forEach(res => {
                if (count <= 10) {
                    prevRes[res] = {
                        image: "../img/icons/prev.png",
                        href: `../search/index.html?q=${res.replaceAll("-", "\-").replaceAll(" ", "-")}`
                    }
                }
                count++
            })
        }

        addItem("Search", "../img/icons/search.png", null, null, null, true, prevRes, "start")
        
        addItem("Host", "../img/icons/plus.png", "../host")
    }

    const pub = await getDoc(doc(db, "users", uid, "data", "public"))

    if (pub.exists()) {
        const data = pub.data()

        
        localStorage.setItem("displayName", data.displayName)
        addBottom()

    }

    
    
});

function addBottom() {
    addItem(localStorage.getItem("displayName"), "../img/pfp.jpg", `../user/index.html?u=${localStorage.getItem("username")}`, "user", bottom)
    addItem("More", "../img/icons/more.png", null, null, bottom, true, {
        // "Switch to Organization": {
        //     func: async function() {
        //         if (confirm("This action cannot be undone, are you sure?")) {
        //             console.log(auth.currentUser.uid)

        //             await setDoc(doc(db, "users", auth.currentUser.uid), {
        //                 org: true
        //             }, {merge: true})
                    
        //         }
        //     }
        // },
        "Log out": {
            image: "../img/icons/logout.png",
            func: function() {
                signOut(auth).then(() => {
                    // Sign-out successful.
                    location.href = "../login/index.html?r=" + window.location.href

                }).catch((error) => {
                    // An error happened.
                });
            }
        },
    })
    sidebar.append(bottom)
}


document.querySelectorAll("label").forEach((e) => {
    document.getElementById(e.htmlFor).click()
})

