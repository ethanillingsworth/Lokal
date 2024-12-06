import { getDoc, doc, setDoc, getDocs, collection, addDoc, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

export class Item {
    constructor(label, img, click) {
        this.label = label
        this.img = img
        this.click = click
        this.id = null
        this.bottom = false
        this.noHover = false
    }
}

export class CustomItem extends Item {
    constructor(customHtml, after) {
        super("", "", "")
        this.customHtml = customHtml
        this.after = () => { after() }
    }
}

export class Sidebar {
    constructor(heading = "Lokal") {
        this.element = document.createElement("div")
        this.element.id = "sidebar"

        document.body.append(this.element)

        this.heading = document.createElement("h1")
        this.heading.id = "heading"
        this.setHeading(heading)

        this.element.append(this.heading)

        this.itemsElement = document.createElement("div")
        this.itemsElement.classList.add("menu")
        this.itemsElement.classList.add("col")
        this.itemsElement.style.gap = "5px"

        this.element.append(this.itemsElement)

        this.menu = new Menu(this.itemsElement)
    }

    setHeading(label) {
        this.heading.innerText = label
    }

}

export class Menu {

    static clicked = false

    constructor(parent) {
        this.element = parent
        this.items = []
    }

    refresh() {
        this.element.innerHTML = ""

        const bottom = document.createElement("div")
        bottom.id = "bottom"


        this.items.forEach((item) => {
            let e = this.element

            if (item.bottom) e = bottom

            const i = document.createElement("div")
            i.classList.add("item")

            if (item.noHover) i.classList.add("no-hov")


            if (item.id != null) i.id = item.id

            e.append(i)

            if (item.customHtml) {
                i.innerHTML = item.customHtml


                item.after()

            }
            else {
                if (item.click instanceof Menu) {
                    const element = item.click.element

                    i.onclick = function () {
                        item.click.refresh()
                        if (Menu.clicked == false) {
                            element.classList.add("showExpand")

                            Menu.clicked = true
                        }
                        else {
                            element.classList.remove("showExpand")
                            Menu.clicked = false
                        }
                    }


                }
                else if (item.click instanceof Function) {
                    i.onclick = function () {
                        item.click()
                    }
                }
                else {
                    i.onclick = function () {
                        window.location.href = item.click
                    }
                }

                const img = document.createElement("img")
                img.src = item.img
                img.classList.add("icon")

                const label = document.createElement("h4")
                label.innerText = item.label

                i.append(img)
                i.append(label)
            }
        })
        this.element.append(bottom)

    }

    addItem(item, bottom = false) {
        item.bottom = bottom
        this.items.push(item)

        this.refresh()
    }
}


let currentlyExpanded = false;

export function addItem(label, img, href, id, parent, expanded, expandedContent, placeContent = "end", params = {}) {
    let link = document.createElement("a")
    link.id = label
    if (href != null) { link.href = href }

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

    if (id != null) { link.id = id }

    link.classList.add("item")

    if (params.noHov) {
        link.classList.add("no-hov")
    }

    if (expanded) {
        // add expanded content
        link.onclick = function () {
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

export async function displayEvent(id, content = document.getElementById("content")) {

    const event = await getEvent(id)

    const u = new User(event.creator)

    const user = await u.getData()

    const username = await u.getUsername()

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
            <h4 class="username">@${username}</h4>
                
            
            <span class="bullet hide">•</span>
            <h4 class="category">${event.category}</h4>
                

        </div>
        <div class="event-details row">
            <span><b>${event.date}</b></span>
            <span class="hide">|</span>
            <span><b>${event.location}</b></span>
            <span class="hide">|</span>
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

        button.onclick = async function () {
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

    open.onclick = function () {
        window.location.href = "../event/index.html?e=" + id
    }

    actions.append(open)



}

export async function getEventUData(eventId) {
    return await getDocs(query(collection(db, "posts", eventId, "uData")))
}

export async function createEvent(data) {
    const event = await addDoc(collection(db, "posts"), data)
    return event.id;
}

export async function updateEvent(eventId, data) {
    await setDoc(doc(db, "posts", eventId), data, { merge: true })

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

export class User {
    constructor(uid) {
        this.uid = uid
    }

    async updateData(data, type) {
        await setDoc(doc(db, "users", this.uid, "data", type), data, { merge: true })
    }
    async getData(type = "public") {

        let u = await getDoc(doc(db, "users", this.uid, "data", type))
        if (!u.exists()) {
            console.error("Could not load userData with creator id: " + this.uid)
            return
        };

        let userData = u.data()
        return userData
    }
    async updateUsername(newUsername) {
        await setDoc(doc(db, "usernames", this.uid), {
            username: newUsername.toLowerCase()
        })

        await setDoc(doc(db, "uids", newUsername.toLowerCase()), {
            userId: this.uid
        })
    }
    async getUsername() {
        let usernameRef = await getDoc(doc(db, "usernames", this.uid))

        if (!usernameRef.exists()) {
            console.error("Could not load username from uid: " + this.uid)
            return
        }

        return usernameRef.data().username
    }

    static async getUID(username) {
        let userIdRef = await getDoc(doc(db, "uids", username))

        if (!userIdRef.exists()) {
            console.error("Could not load uid from username: " + username)
            return
        }

        return userIdRef.data().userId
    }
}

export function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}

export function getVersion() {
    return "Lokal v2 (The Mobile Update)"
}


export class Validation {
    static username(value) {
        // validation

        const name = "Username"

        if (value.length < 4) {
            return name + " must be atleast 4 chars long"
        }

        if (value.length > 15) {
            return name + " cannot be over 15 chars long"
        }

        if (value.startsWith("_") || value.endsWith("_")) {
            return name + " cannot have an _ at the start or end"
        }
        if (value.startsWith("-") || value.endsWith("-")) {
            return name + " cannot have a - at the start or end"
        }

        if (!value.match(/^[A-Za-z0-9._.-]+$/)) {
            return name + " can only contain Alphanumric chars\n Along with chars such as '_' or '-'"
        }


        return true
    }

    static async finalUsername(value) {
        // get exisitng usernames
        const usernames = []

        const q = query(collection(db, "usernames"));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
            usernames.push(doc.data()["username"])
        });

        const name = "Username"

        if (usernames.includes(value)) {
            return name + ` with value of @${value} is already taken`
        }

        return true
    }

    static email(value) {
        if (!value.includes("@") || !value.includes(".")) {
            return "Email isnt valid"
        }
        return true
    }

    static displayName(value) {
        const name = "Display Name"

        if (value.length < 4) {
            return name + " must be atleast 4 chars long"
        }

        if (value.length > 20) {
            return name + " cannot be over 20 chars long"
        }

        return true
    }

    static password(value) {
        const name = "Password"

        if (value.length < 6) {
            return name + " must be atleast 6 chars long"
        }

        return true
    }
}