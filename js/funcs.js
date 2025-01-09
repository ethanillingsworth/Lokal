import { getDoc, doc, setDoc, getDocs, collection, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { logEvent } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

import { auth, db, analytics } from "./firebase.js";

import "./jquery.js"


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
        this.classList = []
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
        this.element = $("<div/>").attr("id", "sidebar")

        $(document.body).append(this.element)

        this.heading = $("<h1/>").attr("id", "heading")
            .on("click", () => {
                window.location.href = "../"

            })

        this.setHeading(heading)

        this.element.append(this.heading)

        this.itemsElement = $("<div/>").addClass("menu").addClass("col").css("gap", "5px")


        this.element.append(this.itemsElement)

        this.menu = new Menu(this.itemsElement)
    }

    setHeading(label) {
        this.heading.text(label)

    }

}

export class Menu {

    static clicked = false

    constructor(parent) {
        this.element = parent
        this.items = []
    }

    refresh() {
        this.element.html("")

        const bottom = $("<div/>").attr("id", "bottom")

        this.items.forEach((item) => {
            let e = this.element

            if (item.bottom) e = bottom

            const i = $("<div/>").addClass("item")

            if (item.noHover) i.addClass("no-hov")


            if (item.id != null) i.attr("id", item.id)

            item.classList.forEach(c => {
                i.addClass(c)
            })

            e.append(i)

            if (item.customHtml) {
                i.html(item.customHtml)


                item.after()

            }
            else {
                if (item.click instanceof Menu) {
                    const element = item.click.element

                    i.on("click", function () {
                        item.click.refresh()
                        if (Menu.clicked == false) {
                            element.addClass("showExpand")

                            Menu.clicked = true
                        }
                        else {
                            element.removeClass("showExpand")
                            Menu.clicked = false
                        }
                    })


                }
                else if (item.click instanceof Function) {
                    i.on("click", function () {
                        item.click()
                    })
                }
                else {
                    i.on("click", function () {
                        if (item.click.startsWith("mailto:")) {
                            window.open(item.click, '_blank').focus();
                        }
                        else {
                            window.location.href = item.click
                        }
                    })
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
        return $(`<${labelType}/>`).text(label).addClass("badge")
    }

    static getFromName(name, type = "h4") {
        if (name == "admin") {
            return new Badge("Lokal Staff", type)
                .css("backgroundColor", "var(--accent)")
        }
        else if (name == "partner") {
            return new Badge("Partner", type)
                .css("backgroundColor", "var(--accent2)")
        }
        else if (name == "group") {
            return new Badge("Group", type)
                .css("backgroundColor", "#3577d4")
        }
        else if (name == "premium") {
            return new Badge("Premium", type)
                .css("backgroundColor", "var(--premium)")
        }
    }


}


export class Event {
    constructor(id) {
        this.id = id
    }

    async display(content = $("#content")) {

        const event = await this.get(this.id)

        const u = new User(event.creator)

        const user = await u.getData()

        const meta = await u.getData("hidden")

        const username = await u.getUsername()

        let cost = "Free admission";

        if (event.cost > 0) {
            cost = `$${event.cost} per person`
        }

        // make event
        const ev = $("<div/>")
            .addClass("event")
            .attr("id", this.id)
            .html(`<img class="pfp border" src="../img/pfp.jpg">
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
                    
                
            </div>`)

        content.append(ev)

        const badges = ev.find(".badges")

        if (user.accentColor) {
            ev.find(".pfp").css("borderColor", user.accentColor)
        }

        if (meta.badges) {

            meta.badges.forEach((badgeName) => {
                const badge = Badge.getFromName(badgeName, "h5")

                badges.append(badge)
                badges.css("display", "flex")
            })
        }

        // ev.querySelector(".pfp").onclick = function () {
        //     window.location.href = `../user/index.html?u=${username}`
        // }

        // ev.querySelector(".display-name").onclick = function () {
        //     window.location.href = `../user/index.html?u=${username}`
        // }

        if (event.preview) {
            ev.find(".event-image").attr("src", event.preview)
        }
        else {
            ev.find(".event-image").css("display", "none")
        }

        if (user.pfp) {
            ev.find(".pfp").attr("src", user.pfp)
        }

        // actions

        let attending = 0

        let selfAttend = false

        const uData = await this.getUData()

        uData.forEach((doc) => {
            const data = doc.data()

            if (data.attending) {
                attending += 1
            }
            if (auth.currentUser) {
                if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
            }
        })

        const left = $("<div/>").addClass("row")

        const actions = ev.find(`.actions`)

        actions.append(left)

        function addAction(l, src, func) {
            const action = $("<div/>").addClass("action")

            const img = $("<img/>").attr("src", src)

            const label = $("<span/>").text(l)

            action.append(img)
            action.append(label)

            left.append(action)

            if (auth.currentUser) {

                if (auth.currentUser.uid != event.creator) func(action, label)
            }

        }

        addAction(`${attending} Attending`, "../img/icons/profile.png", (button, span) => {
            if (selfAttend) {
                button.css("border", "3px solid var(--accent)")

            }

            button.on("click", async () => {
                if (selfAttend) {
                    selfAttend = false
                    button.css("border", "3px solid transparent")
                    attending -= 1

                }
                else {
                    selfAttend = true
                    button.css("border", "3px solid var(--accent)")
                    attending += 1

                }

                span.text(`${attending} Attending`);

                await setDoc(doc(db, "posts", this.id, "uData", auth.currentUser.uid), {
                    attending: selfAttend
                })

            })


        })


        const open = $("<div/>").addClass("action")

        const openImage = $("<img/>").attr("src", "../img/icons/arrow.png")

        open.append(openImage)

        open.on("click", () => {
            window.location.href = "../event/index.html?e=" + this.id
        })

        actions.append(open)

    }

    async getUData() {
        return await getDocs(query(collection(db, "posts", this.id, "uData")))
    }

    async update(data) {
        await setDoc(doc(db, "posts", this.id), data, { merge: true })
    }

    async get() {
        let e = await getDoc(doc(db, "posts", this.id))

        if (!e.exists()) {
            console.error("Could not load event with id: " + this.id)
            return {}
        }


        let eventData = e.data()

        return eventData
    }

    static async create(data) {
        const event = await addDoc(collection(db, "posts"), data)
        return event.id;
    }
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

    async getBadges() {
        const meta = await this.getData("hidden")

        let badges = []

        if (meta.badges) {
            badges = meta.badges
        }

        return badges
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

    async updateMemberReadOnly(memberId, data) {
        await setDoc(doc(db, "users", this.uid, "members", memberId, "readOnly", "data"), data, { merge: true })
    }

    async getMember(memberId) {
        const ref = await getDoc(doc(db, "users", this.uid, "members", memberId))

        if (!ref.exists()) {
            console.error("Could not fetch data for member ID:" + memberId)
            return {}
        }

        return ref.data()
    }

    async getMemberReadOnly(memberId) {
        const ref = await getDoc(doc(db, "users", this.uid, "members", memberId, "readOnly", "data"))

        if (!ref.exists()) {
            console.error("Could not fetch read only data for member ID:" + memberId)
            return {}
        }

        return ref.data()
    }

    static async display(uname, pub, meta, content = $("#content"), groupAdmin = false) {

        const user = $("<div/>")
            .addClass("user")
            .addClass("row")
            .css("gap", 0)
            .css("flex-wrap", "nowrap")
            .css("width", "calc(100% - 40px)")
            .css("place-content", "start")
            .css("place-items", "start")

        const pfp = $("<img/>")
            .addClass("pfp")
            .addClass("border")
            .attr("src", "../img/pfp.jpg")

        if (pub.pfp) {
            pfp.attr("src", pub.pfp)
        }

        if (pub.accentColor) {
            pfp.css("border-color", pub.accentColor)
        }

        const userDetails = $("<div/>")
            .addClass("col")

        const userRow = $("<div/>")
            .addClass("row")
            .css("width", "100%")
            .css("place-content", "start")


        const badges = $("<div/>")
            .addClass("row")
            .addClass("badges")
            .css("display", "none")
            .css("placeContent", "start")

        if (meta.badges) {

            meta.badges.forEach((badgeName) => {
                const badge = Badge.getFromName(badgeName, "h5")

                badges.append(badge)
                badges.css("display", "flex")
            })
        }

        if (groupAdmin) {
            const badge = new Badge("Admin", "h5")
            badge.css("backgroundColor", "#144a96")

            badges.append(badge)
            badges.css("display", "flex")
        }


        const displayName = $("<h4/>").text(pub.displayName).addClass("display-name")

        const username = $("<h4/>")
            .css("font-weight", "normal")
            .css("color", "gray")
            .text(`(@${uname})`)

        userRow.append(displayName)
        userRow.append(username)

        const desc = $("<p/>").text(pub.desc)

        userDetails.append(userRow)
        userDetails.append(badges)
        userDetails.append(desc)

        user.append(pfp)
        user.append(userDetails)

        const actions = $("<div/>")
            .addClass("actions")
            .css("width", "auto")
            .css("margin-left", "auto")
            .css("margin-top", "auto")
            .css("margin-bottom", "auto")



        const open = $("<img/>")
            .attr("src", "../img/icons/arrow.png")
            .addClass("action")
            .attr("id", "open")
            .on("click", function () {
                window.location.href = "../user/index.html?u=" + uname;
            });


        actions.append(open)

        user.append(actions)

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


export class Utils {

    static toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1);
        });
    }

    static getVersion() {
        return "Lokal v6 (Reconsolidation pt 2)"
    }

    static getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // thanks chatgpt

    static rgbToHex(rgb) {
        // Extract the numbers from the rgb string using a regex
        const result = rgb.match(/\d+/g);
        if (!result || result.length !== 3) {
            throw new Error("Invalid RGB input");
        }

        // Convert each number to a 2-digit hexadecimal and concatenate them
        const [r, g, b] = result.map(num => parseInt(num, 10));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }

    static logMetric(name, data) {
        logEvent(analytics, name, data)
    }
}
