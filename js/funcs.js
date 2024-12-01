import { getDoc, doc, setDoc, getDocs, updateDoc, collection, addDoc, Timestamp, arrayUnion, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

let currentlyExpanded = false;

export function addItem(label, img, href, id, parent, expanded, expandedContent, placeContent="end", params={}) {
    let link = document.createElement("a")
    link.id = label
    if (href != null) {link.href = href}
    
    link.tabIndex = 0


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
                addItem(key, element.image, element.href, key, expand, null, null, null, element.params)
                if (element.func != null) {
                    document.getElementById(key).onclick = function () {
                        expandedContent[key].func()
                    }
                }
    
                
            })

            document.querySelectorAll(".item.border").forEach((el) => {
                el.classList.remove("border")
            })
            

            if (currentlyExpanded) {
                // close

                currentlyExpanded = false
                expand.classList.remove("showExpand")

                link.classList.remove("border")

            }
            else {
                // open
                currentlyExpanded = true;
                expand.style.placeContent = placeContent
                expand.classList.add("showExpand")
                link.classList.add("border")
            }
            
        }
        
    }

    parent.append(link)

    if (params.afterFunc) {
        params.afterFunc()
    }

}

export async function displayEvent(id, content=document.getElementById("content")) {
    
    const event = await getEvent(id)

    const user = await getUserData(event.creator)

    const username = await getUsername(event.creator)

    let cost = "Free admission";

    if (event.cost > 0) {
        cost = `$${event.cost} per person`
    }

    // make event
    const ev = document.createElement("div")
    ev.classList.add("event")
    ev.id = id

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
        <div class="event-details row">
            <span><b>${event.date}</b></span>
            |
            <span><b>${event.location}</b></span>
            |
            <span><b>${cost}</b></span>
        </div>
        <p>
            ${event.desc}
        </p>
        <!-- <img class="event-image" src="../img/sample.jpg"> -->
    
        <div class="actions">
            
        </div>
            
        
    </div>
    `
    content.appendChild(ev)

    // actions

    let attending = 0
    
    let selfAttend = false

    const uData = await getEventUData(id)

    uData.forEach((doc) => {
        const data = doc.data()

        if (data.attending) {
            attending += 1
        }
        if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
    })

    const left = document.createElement("div")
    left.classList.add("row")

    const actions = ev.querySelector(`.actions`)

    actions.append(left)

    function addAction(l, src, func) {
        const action = document.createElement("div")
        action.classList.add("action")

        const img = document.createElement("img")
        img.src = src

        const label = document.createElement("span")
        label.innerText = l

        action.append(img)
        action.append(label)

        left.append(action)

        if (auth.currentUser.uid != event.creator) func(action, label)

    }

    addAction(`${attending} Attending`, "../img/icons/profile.png", (button, span) => {
        if (selfAttend) {
            button.style.border = "3px solid var(--accent)"
        }

        button.onclick = async function() {
            if (selfAttend) {
                selfAttend = false
                button.style.border = "3px solid transparent"
                attending -= 1

            }
            else {
                selfAttend = true
                button.style.border = "3px solid var(--accent)"
                attending += 1

            }
            
            span.innerText = `${attending} Attending`;
            await setDoc(doc(db, "posts", id, "uData", auth.currentUser.uid), {
                attending: selfAttend
            })
            
        }

        
    })


    const open = document.createElement("div")
    open.classList.add("action")

    const openImage = document.createElement("img")

    openImage.src = "../img/icons/arrow.png"

    open.append(openImage)
    
    open.onclick = function() {
        window.location.href = "../event/index.html?e=" + id
    }

    actions.append(open)

        
    
}

export async function getEventUData(eventId) {
    return await getDocs(query(collection(db, "posts", eventId, "uData")))
}

export async function createEvent(uid, cate, desc, date, location, cost, tags, title, agenda) {
    const event = await addDoc(collection(db, "posts"), {
        title: title,
        agenda: agenda,
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

export async function getEvent(eventId) {
    let e = await getDoc(doc(db, "posts", eventId))

    if (!e.exists()) {
        console.error("Could not load event with id: " + eventId)
        return {}
    }

    
    let eventData = e.data()

    return eventData
}

export async function getUserData(uid) {

    let u = await getDoc(doc(db, "users", uid, "data", "public"))
    if (!u.exists()) {
        console.error("Could not load userData with creator id: " + uid)
    };

    let userData = u.data()
    return userData
}

export async function getUsername(uid) {
    let usernameRef = await getDoc(doc(db, "usernames", uid))

    if (!usernameRef.exists()) {
        console.error("Could not load username from uid: " + uid)
    }

    return usernameRef.data().username
}

export function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}