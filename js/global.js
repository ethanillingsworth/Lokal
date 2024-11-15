import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDoc, doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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


export function addItem(label, img, href, id, parent, expanded, expandedContent) {
    const link = document.createElement("a")
    if (id != null) link.id = id
    if (href != null) {link.href = href}

    if (parent == null) {
        parent = sidebar
    }
    
    link.classList.add("item")

    const image = document.createElement("img")
    image.src = img
    image.classList.add("icon")

    const lab = document.createElement("h4")
    lab.innerText = label

    link.append(image)
    link.append(lab)

    if (expanded) {

        // add expanded content
        Object.keys(expandedContent).forEach((key) => {
            addItem(key, expandedContent[key].image, null, key, expand)

            document.getElementById(key).onclick = function () {
                console.log(expandedContent[key].func())
            }

            
        })

        link.onclick = function() {
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

export async function displayEvent(eventId) {
    // get data from eid
    
    let e = await getDoc(doc(db, "posts", eventId)) 

    if (e.exists()) {
        let eventData = e.data()
        let u = await getDoc(doc(db, "users", eventData.creator, "data", "public"))

        if (u.exists()) {
            let userData = u.data()
            display(eventData, userData)

        };
    }

    function display(event, user) {

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
            <div class="user-info row">
                <h4 class="display-name">${user.displayName}</h4>
                <h4 class="username">@${user.username}</h4>
                <span class="bullet">•</span>
                <h4 class="category">${event.category}</h4>
            </div>
            <p>
                ${event.desc}
            </p>
            <div class="event-details">
                <span>${event.date}</span>
                |
                <span>${event.location}</span>
                |
                <span>${cost}</span>
            </div>
            <img class="event-image" src="../img/sample.jpg">
        
            <div class="actions">
                <div class="action">
                    
                    <img src="img/icons/profile.png">
                    <span class="count">43 RSVPs</span>
                    
                </div>
            </div>
                
            
        </div>
        `

        content.append(ev)
    }
}

export async function createEvent(uid, cate, desc, date, location, cost) {
    const event = await addDoc(collection(db, "posts"), {
        creator: uid,
        category: cate,
        desc: desc,
        date: date.toLocaleDateString("en-US"),
        location: location,
        cost: cost

    })
    return event.id;
}

addItem("Home", "../img/icons/home.png", "../")
addItem("My Events", "../img/icons/party.png", "../events")
addItem("Host", "../img/icons/plus.png", "../host")

if (localStorage.getItem("displayName")) {
    addBottom()
}

export function checkInCache(name, value, after) {
    if (!localStorage.getItem(name)) {
        localStorage.setItem(name, value)
        if (after != null) after()
    }

}

export function removeFromCache(name, after) {
    if (localStorage.getItem(name)) {
        localStorage.removeItem(name)
        if (after != null) after()
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
          
        location.href = "../login"

    } 
    const uid = user.uid;

    const pub = await getDoc(doc(db, "users", uid, "data", "public"))

    if (pub.exists()) {
        const data = pub.data()
        checkInCache("displayName", data.displayName, addBottom)
        checkInCache("username", data.username)



        // use user pfp
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