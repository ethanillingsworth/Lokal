import { signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { auth } from "./firebase.js";

// debug only version
const ver = document.createElement("span")
ver.id = "ver"
ver.innerText = "build 24M11D13"
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
                expand.style.minWidth = "calc(100% / 5)"
                expand.style.borderRight = "4px solid var(--dark2)"
                expand.style.padding = "5px"
                expand.style.height = "calc(100% - 10px)"
                link.classList.add("border")
            }
            
        }
    }

    parent.append(link)
}

addItem("Home", "../img/icons/home.png", "../")
addItem("My Events", "../img/icons/party.png", "../events")
addItem("Host", "../img/icons/plus.png", "../host")
// use user pfp
addItem("Profile", "../img/pfp.jpg", "../user", "user", bottom)
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

const content = document.createElement("div")
content.id = "content"

document.body.append(content)

export function addEvent(username) {
    // get data from username with firebase

    // make event
    const event = document.createElement("div")
    event.classList.append("event")

    event.innerHTML = `
    <img class="pfp border" src="../img/pfp.jpg">
    <div class="event-content">
        <div class="user-info row">
            <h4 class="display-name">Elk Grove High School</h4>
            <h4 class="username">@eghs</h4>
            <span class="bullet">•</span>
            <h4 class="category">Sports</h4>
        </div>
        <p>
            EGHS is hosting a football game this friday! Go Grens!!
        </p>
        <div class="event-details">
            <span>Jan 21, 2024</span>
            |
            <span>
                <a href="https://www.google.com/maps/place/500+W+Elk+Grove+Blvd" target="_blank">500 W Elk Grove Blvd</a>
            </span>
            |
            <span>Free Admission</span>
        </div>
        <img class="event-image" src="../img/sample.jpg">
    
        <div class="actions">
            <div class="action">
                <div class="action-content">
                    <img src="img/icons/star-outline.png" class="star">
                    <span class="count">25K</span>
                </div>
            </div>
        </div>
            
        
    </div>
    <hr>
    `

    content.append(event)
}