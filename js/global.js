import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDoc, doc, setDoc, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";


// debug only version
const ver = document.createElement("span")
ver.id = "ver"
ver.innerText = "DEV BUILD"
document.body.append(ver)


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

let currentlyExpanded = false;


export function addItem(label, img, href, id, parent, expanded, expandedContent, placeContent="end", params={}) {
    let link = document.createElement("a")
    if (href != null) {link.href = href}


    if (parent == null) {
        parent = sidebar
    }

    if (!params.hideImage) {
        const image = document.createElement("img")
        image.src = img
        image.classList.add("icon")
        link.append(image)
    }

    if (!params.hideLabel) {
        const lab = document.createElement("h4")
        lab.innerText = label
        
        link.append(lab)
    }

    if (params.customHtml) {
        link.innerHTML = params.customHtml
    }

    if (id != null) {link.id = id}
    
    link.classList.add("item")

    if (params.noHov) {
        link.classList.add("no-hov")
    }

    if (expanded) {
        // add expanded content
        link.onclick = function() {
            expand.innerHTML = ""
            Object.keys(expandedContent).forEach((key) => {
                const element = expandedContent[key]
                addItem(key, element.image, null, key, expand, null, null, null, element.params)
    
                document.getElementById(key).onclick = function () {
                    expandedContent[key].func()
                }
    
                
            })

            document.querySelectorAll(".item.border").forEach((el) => {
                el.classList.remove("border")
            })
            

            if (currentlyExpanded) {
                // close
                expand.style.minWidth = "0"
                expand.style.padding = "0"
                expand.style.height = "100%"
                expand.style.borderRight = "0px solid var(--dark2)"

                currentlyExpanded = false
                link.classList.remove("border")

            }
            else {
                // open
                currentlyExpanded = true;
                expand.style.minWidth = "20%"
                expand.style.placeContent = placeContent
                expand.style.borderRight = "4px solid var(--dark2)"
                expand.style.padding = "5px"
                expand.style.height = "calc(100% - 10px)"
                link.classList.add("border")
            }
            
        }
    }

    parent.append(link)
}


const content = document.createElement("div")
content.id = "content"

document.body.append(content)

export async function displayEvent(eventId, content=document.getElementById("content")) {
    // get data from eid
    
    let e = await getDoc(doc(db, "posts", eventId)) 

    if (e.exists()) {
        let eventData = e.data()
        let u = await getDoc(doc(db, "users", eventData.creator, "data", "public"))

        if (u.exists()) {
            let userData = u.data()
            let username = await getDoc(doc(db, "usernames", eventData.creator))

            if (username.exists()) {
                const usrname = username.data().username

                display(eventData, userData, usrname)

            }

            

        };
    }

    function display(event, user, username) {

        let cost = "Free admission";

        if (event.cost > 0) {
            cost = `$${event.cost} per person`
        }
        // make event
        const ev = document.createElement("div")
        ev.classList.add("event")

        ev.innerHTML = `
        <img class="pfp border" src="../img/pfp.jpg">
        <div class="event-content">
            <div class="user-info row" style="gap: 5px;">
                <h4 class="display-name">${user.displayName}</h4>
                <div class="row" style="gap: 5px;">
                    <h4 class="username">@${username}</h4>
                    <span class="bullet">•</span>
                    <h4 class="category">${event.category}</h4>
                </div>

            </div>
            <p>
                ${event.desc}
            </p>
            <div class="event-details row">
                <span><b>${event.date}</b></span>
                |
                <span><b>${event.location}</b></span>
                |
                <span><b>${cost}</b></span>
            </div>
            <img class="event-image" src="../img/sample.jpg">
        
            <div class="actions">
                <div class="action">
                    
                    <img src="../img/icons/profile.png">
                    <span class="count">43 RSVPs</span>
                    
                </div>
            </div>
                
            
        </div>
        `

        content.append(ev)
    }
}

export async function createEvent(uid, cate, desc, date, location, cost, tags) {
    const event = await addDoc(collection(db, "posts"), {
        creator: uid,
        category: cate,
        desc: desc,
        date: date.toLocaleDateString("en-US"),
        location: location,
        cost: cost,
        tags: tags,
        timestamp: Timestamp.fromDate(new Date())

    })
    return event.id;
}


addItem("Home", "../img/icons/home.png", "../")
addItem("Connect", "../img/icons/party.png", "../events")




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
          
        location.href = "../login"

    } 
    const uid = user.uid;

    //createEvent(uid, "Sports", "Verrat de marde de mosus de doux Jésus de charrue de saint-ciboire de sacristi de crucifix de colon d'étole de maudite marde.", new Date(), "Elk Grove High School", 0, [])

    const username = await getDoc(doc(db, "usernames", uid))

    if (username.exists()) {
        const data = username.data()
        checkInCache("username", data.username)
    }

    const pub = await getDoc(doc(db, "users", uid, "data", "public"))

    if (pub.exists()) {
        const data = pub.data()

        const prevRes = {
            search: {
                params: {
                    hideImage: true,
                    hideLabel: true,
                    noHov: true,
                    customHtml: `
                        <input placeholder="Search" id="search"></input>
                    `
                }
            }
        }
        if (data.prevRes) {
            data.prevRes.forEach(res => {
                prevRes[res] = {
                    image: "../img/icons/prev.png"
                }
            })
        }

        addItem("Search", "../img/icons/search.png", null, null, null, true, prevRes, "start")
        addItem("Host", "../img/icons/plus.png", null, null, null, true, {}, "start")
        
        checkInCache("displayName", data.displayName, addBottom)

    }

    
    
});

function addBottom() {
    addItem(localStorage.getItem("displayName"), "../img/pfp.jpg", `../user/index.html?u=${localStorage.getItem("username")}`, "user", bottom)
    addItem("More", "../img/icons/more.png", null, null, bottom, true, {
        "Log out": {
            image: "../img/icons/logout.png",
            func: function() {
                signOut(auth).then(() => {
                    // Sign-out successful.
                    location.href = "../login"
                }).catch((error) => {
                    // An error happened.
                });
            }
        }
    })
    sidebar.append(bottom)
}