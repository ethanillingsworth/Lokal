import { getDoc, doc, setDoc, getDocs, collection, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";


export class Alert {

    constructor(text) {
        this.element = document.createElement("div")
        this.element.classList.add("alert")

        this.background = document.createElement("div")
        this.background.id = "bg"

        this.element.append(this.background)

        this.modal = document.createElement("div")
        this.modal.classList.add("modal")
        this.element.append(this.modal)
        this.modal.style.gap = "20px"

        this.textElement = document.createElement("p")
        this.textElement.innerText = text
        this.textElement.classList.add("alert-text")

        this.modal.append(this.textElement)

        this.buttons = document.createElement("div")
        this.buttons.classList.add("row")
        this.buttons.style.width = "100%"

        this.modal.append(this.buttons)

        this.addButton("Okay", () => {
            this.hide()
        })
    }

    addButton(label, func) {
        const button = document.createElement("button")
        button.innerText = label
        button.onclick = () => {
            func()
        }

        this.buttons.append(button)
    }

    show() {
        document.body.append(this.element)

    }

    hide() {
        this.element.remove()
    }
}

export class Prompt extends Alert {
    constructor(text) {
        super(text)

        this.buttons.remove()

        this.buttons = document.createElement("div")
        this.buttons.classList.add("row")
        this.buttons.style.width = "100%"

        this.fields = document.createElement("div")
        this.fields.classList.add("col")
        this.fields.style.width = "100%"

        this.modal.append(this.fields)

        this.addButton("Cancel", () => {
            this.hide()
        })

        this.doneFunction = () => { }

        this.addButton("Done", () => {
            this.doneFunction()
            this.hide()
        })

        this.modal.append(this.buttons)
    }

    addField(label, after) {

        const row = document.createElement("div")
        row.classList.add("row")
        row.style.placeContent = "start"
        row.style.flexWrap = "nowrap"


        const lab = document.createElement("h3")
        lab.innerText = label
        lab.style.textWrap = "nowrap"

        row.append(lab)

        after(row)

        this.fields.append(row)

    }

    setDoneFunction(func) {
        this.doneFunction = func
    }
}

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
        this.heading.onclick = () => {
            window.location.href = "../"
        }

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

export class Badge {

    constructor(label, labelType = "h4") {
        this.badge = document.createElement(labelType)
        this.badge.innerText = label
        this.badge.classList.add("badge")

        return this.badge

    }


}



export async function displayEvent(id, content = document.getElementById("content")) {

    const event = await getEvent(id)

    const u = new User(event.creator)

    const user = await u.getData()

    const meta = await u.getData("hidden")

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
    
        <div class="user-info row" style="gap: 5px; place-items: center">
            <h4 class="display-name">${user.displayName}</h4>
            <h4 class="username">(@${username})</h4>
                
            
            <span class="bullet hide">•</span>
            <h4 class="category">${event.category}</h4>
                

        </div>
        <div class="row badges" style="display: none"></div>
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
        <img class="event-image" src="../img/sample.jpg">
    
        <div class="actions">
            
        </div>
            
        
    </div>
    `
    content.appendChild(ev)

    const badges = ev.querySelector(".badges")

    if (user.accentColor) {
        ev.querySelector(".pfp").style.borderColor = user.accentColor
    }

    if (meta.admin) {
        const badge = new Badge("Lokal Staff", "h5")
        badge.style.backgroundColor = "var(--accent)"

        badges.append(badge)
        badges.style.display = "flex"
    }

    if (meta.partner) {
        const badge = new Badge("Partner", "h5")
        badge.style.backgroundColor = "var(--accent2)"

        badges.append(badge)
        badges.style.display = "flex"
    }

    if (meta.group) {
        const badge = new Badge("Group", "h5")
        badge.style.backgroundColor = "#3577d4"

        badges.append(badge)
        badges.style.display = "flex"
    }

    ev.querySelector(".pfp").onclick = function () {
        window.location.href = `../user/index.html?u=${username}`
    }

    ev.querySelector(".display-name").onclick = function () {
        window.location.href = `../user/index.html?u=${username}`
    }

    if (event.preview) {
        ev.querySelector(".event-image").src = event.preview
    }
    else {
        ev.querySelector(".event-image").style.display = "none"
    }

    if (user.pfp) {
        ev.querySelector(".pfp").src = user.pfp
    }

    // actions

    let attending = 0

    let selfAttend = false

    const uData = await getEventUData(id)

    uData.forEach((doc) => {
        const data = doc.data()

        if (data.attending) {
            attending += 1
        }
        if (auth.currentUser) {
            if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
        }
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

        if (auth.currentUser) {

            if (auth.currentUser.uid != event.creator) func(action, label)
        }

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

        let u = undefined

        if (type != "hidden") {
            u = await getDoc(doc(db, "users", this.uid, "data", type))
        }
        else {
            u = await getDoc(doc(db, "users", this.uid))
        }


        if (!u.exists()) {
            if (type != "hidden")
                console.error("Could not load userData with id: " + this.uid + " type: " + type)
            return {}
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

    async updateMember(memberId, data) {
        await setDoc(doc(db, "users", this.uid, "members", memberId), data, { merge: true })
    }

    async getMember(memberId) {
        const ref = await getDoc(doc(db, "users", this.uid, "members", memberId))

        if (!ref.exists()) {
            console.error("Could not fetch data for member ID:" + memberId)
            return {}
        }

        return ref.data()
    }

    static async display(uname, pub, meta, content = document.getElementById("content"), groupAdmin = false) {

        const user = document.createElement("div")
        user.classList.add("user")
        user.classList.add("row")
        user.style.gap = "0"
        user.style.flexWrap = "nowrap"
        user.style.width = "calc(100% - 40px)"
        user.style.placeContent = "start"
        user.style.placeItems = "start"




        const pfp = document.createElement("img")
        pfp.classList.add("pfp")
        pfp.classList.add("border")
        pfp.src = "../img/pfp.jpg"

        if (pub.pfp) {
            pfp.src = pub.pfp
        }

        if (pub.accentColor) {
            pfp.style.borderColor = pub.accentColor
        }

        const userDetails = document.createElement("div")
        userDetails.classList.add("col")

        const userRow = document.createElement("div")
        userRow.classList.add("row")
        userRow.style.width = '100%'
        userRow.style.placeContent = "start"

        const badges = document.createElement("div")
        badges.classList.add("row")
        badges.classList.add("badges")
        badges.style.display = "none"

        if (meta.admin) {
            const badge = new Badge("Lokal Staff", "h5")
            badge.style.backgroundColor = "var(--accent)"

            badges.append(badge)

            badges.style.display = "flex"
        }

        if (meta.partner) {
            const badge = new Badge("Partner", "h5")
            badge.style.backgroundColor = "var(--accent2)"

            badges.append(badge)
            badges.style.display = "flex"
        }

        if (meta.group) {
            const badge = new Badge("Group", "h5")
            badge.style.backgroundColor = "#3577d4"

            badges.append(badge)
            badges.style.display = "flex"
        }

        if (groupAdmin) {
            const badge = new Badge("Admin", "h5")
            badge.style.backgroundColor = "#144a96"

            badges.append(badge)
            badges.style.display = "flex"
        }





        const displayName = document.createElement("h4")
        displayName.innerText = pub.displayName
        displayName.classList.add("display-name")


        const username = document.createElement("h4")
        username.style.fontWeight = "normal"
        username.style.color = "gray"
        username.innerText = `(@${uname})`

        userRow.append(displayName)
        userRow.append(username)

        const desc = document.createElement("p")
        desc.innerText = pub.desc

        userDetails.append(userRow)

        badges.style.placeContent = "start"
        userDetails.append(badges)

        userDetails.append(desc)

        user.append(pfp)
        user.append(userDetails)

        const actions = document.createElement("div")
        actions.classList.add("actions")
        actions.style.width = "auto"
        actions.style.marginLeft = "auto"

        const open = document.createElement("img")
        open.src = "../img/icons/arrow.png"
        open.onclick = function () {

            window.location.href = "../user/index.html?u=" + uname


        }
        open.classList.add("action")
        open.id = "open"


        actions.append(open)

        user.append(actions)

        actions.style.marginTop = "auto"
        actions.style.marginBottom = "auto"




        content.append(user)

        return user

    }

    static async getUID(username) {
        let userIdRef = await getDoc(doc(db, "uids", username))

        if (!userIdRef.exists()) {
            console.error("Could not load uid from username: " + username)
            return
        }

        return userIdRef.data().userId
    }


    static async createUser(username, pub = {}, priv = {}, meta = {}) {

        const d = await addDoc(collection(db, "users"), meta)

        const user = new User(d.id)

        await user.updateUsername(username.toLowerCase())

        await user.updateData(pub, "public")

        await user.updateData(priv, "private")

        return new User(d.id)

    }
}

export function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}

export function getVersion() {
    return "Lokal v4 (Organization Takeover)"
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

        const q = query(collection(db, "usernames"), where("username", "==", value));

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


export function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// thanks chatgpt

export function rgbToHex(rgb) {
    // Extract the numbers from the rgb string using a regex
    const result = rgb.match(/\d+/g);
    if (!result || result.length !== 3) {
        throw new Error("Invalid RGB input");
    }

    // Convert each number to a 2-digit hexadecimal and concatenate them
    const [r, g, b] = result.map(num => parseInt(num, 10));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}