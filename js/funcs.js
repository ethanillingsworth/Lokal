import { getDoc, doc, setDoc, getDocs, deleteDoc, collection, addDoc, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { logEvent } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

import { ref, getDownloadURL, uploadBytes, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

import { auth, db, analytics, imgDB } from "./firebase.js";

import "./jquery.js"

import "https://cdnjs.cloudflare.com/ajax/libs/jquery-csv/1.0.40/jquery.csv.min.js"

export const graphColors = [
    "#FF6B6B",  // Bright Coral Red
    "#1E90FF",  // Vivid Blue
    "#FFD166",  // Warm Gold
    "#06D6A0",  // Neon Green
    "#9B5DE5",  // Electric Purple
    "#F4A261",  // Sunset Orange
    "#4ECDC4",  // Cyan
    "#FF4D6D",  // Hot Pink
    "#8338EC",  // Deep Violet
    "#48CAE4",  // Light Neon Blue
    "#00C49A",  // Emerald Green
    "#FF007F",  // Neon Pink
    "#8A2BE2",  // Blue Violet
    "#FF4500",  // Bright Orange Red
    "#3D5AFE",  // Bright Indigo
    "#E63946",  // Warm Crimson
    "#26A69A",  // Deep Teal
    "#F72585",  // Magenta
    "#B5179E",  // Dark Pink
    "#4361EE",  // Electric Blue
    "#3A0CA3",  // Deep Indigo
    "#FB8B24",  // Vibrant Orange
    "#43AA8B",  // Rich Teal Green
    "#EF233C",  // Bright Red
    "#2A9D8F",  // Muted Teal
    "#E76F51",  // Soft Brick Red
    "#D00000",  // Intense Red
    "#6A0572",  // Deep Purple
    "#00A6FB",  // Sky Blue
    "#9F86C0",  // Lavender Purple
    "#A7C957",  // Fresh Lime Green
    "#833471",  // Dark Magenta
    "#118AB2",  // Cool Ocean Blue
    "#E63946"   // Bright Crimson
];


export class CSS {
    static loadFile(url) {
        $('head').append(`<link rel="stylesheet" type="text/css" href="${url}">`);
    }

    static loadFiles(urls) {
        urls.forEach((url) => {
            CSS.loadFile(url);
        })
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

            const i = $("<div/>").addClass("item").attr("tabindex", 0)

            if (item.noHover) i.addClass("no-hov")


            if (item.id != null) i.attr("id", item.id)

            item.classList.forEach(c => {
                i.addClass(c)
            })

            e.append(i)

            if (item.customHtml) {
                i.html(item.customHtml)


                item.after(i)

            }
            else {

                if (item.click == "") { }
                else if (item.click instanceof Menu) {
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
                if (item.img != "") {
                    const img = document.createElement("img")
                    img.src = item.img
                    img.classList.add("icon")

                    i.append(img)
                }

                const label = document.createElement("h4")
                label.innerText = item.label
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

// Generic Post
export class Post {
    constructor(id, path) {
        this.id = id
        this.path = path
    }

    async display(content = $("#content"), pinned = false) {
        const post = await this.get(this.id)

        if (Object.keys(post).length <= 0) {
            return
        }

        const creator = new User(post.creator)

        const user = await creator.getData()

        const meta = await creator.getData("hidden")

        const username = await creator.getUsername()

        const postElem = $("<div/>")
            .addClass("event")
            .attr("id", this.id)
            .html(`<img class="pfp border" src="../img/pfp.jpg">
            <div class="col" style="width: 100%">
                <div class="content-wrapper row">
                    <div class="event-content">
                    
                        <div class="user-info row" style="gap: 5px; place-items: center">
                            <h4 class="display-name">${user.displayName}</h4>
                            <h4 class="username">(@${username})</h4>
                        </div>
                        <div class="row badges" style="display: none"></div>
                        <h4>${post.title}</h4>
                        <p>
                            ${post.desc.replaceAll("\n", "<br>")}
                        </p>     
                    </div>
                </div>
                <div class="row tools" style="place-content: end;"></div>
            </div>`)


        postElem.find(".pfp").on("click", async () => {
            window.location.href = "../user/index.html?u=" + username
        })

        if (user.accentColor) {
            postElem.find(".pfp").css("borderColor", user.accentColor)
        }

        const readOnly = await creator.getMemberReadOnly(auth.currentUser.uid)
        const badges = await new User(auth.currentUser.uid).getBadges()

        // add more menu
        if (readOnly.admin || badges.includes("admin")) {

            const more = new MoreMenu()

            if (pinned) {
                more.add("Unpin", async () => {
                    await this.unpin(creator)
                    window.location.reload()
                })
            }
            else {
                more.add("Pin", async () => {
                    await this.pin(creator)
                    window.location.reload()
                })
            }

            more.add("Delete", async () => {
                if (confirm("Are you sure you want to delete this event?")) {
                    await this.delete()
                    postElem.css("display", "none")
                }
            })
            postElem.find(".tools").append(more.more)
        }

        if (meta.badges) {

            meta.badges.forEach((badgeName) => {
                const badge = Badge.getFromName(badgeName, "h5")

                postElem.find(".badges").append(badge)
                postElem.find(".badges").css("display", "flex")
            })
        }


        if (pinned) {
            if (user.accentColor) {
                postElem.css("borderColor", user.accentColor)
            }
            else {
                postElem.css("borderColor", "var(--accent)")
            }
        }

        postElem.find(".pfp").attr("src", await creator.getPfp())

        content.append(postElem)
    }

    async get() {
        let p = await getDoc(doc(db, this.path, this.id))

        if (!p.exists()) {
            console.error(`Could not load post with id: ${this.id} Path: ${this.path}/${this.id}`)
            return {}
        }


        let data = p.data()

        return data
    }

    static async create(data, path) {
        const p = await addDoc(collection(db, path), data)
        return p.id;
    }

    async update(data) {
        await setDoc(doc(db, this.path, this.id), data, { merge: true })
    }

    async delete() {
        await deleteDoc(doc(db, this.path, this.id))
    }

    async pin(group) {
        await group.updateData({ pinned: { id: this.id, path: this.path } }, "public")
    }

    async unpin(group) {
        await group.updateData({ pinned: null }, "public")
    }
}

export class Update extends Post {
    constructor(id) {
        super(id, "updates")
    }
}

export class Event {
    constructor(id) {
        this.id = id
        this.bucket = new ImageBucket(id, "EVENT")
    }

    async display(content = $("#content"), pinned = false) {
        const event = await this.get(this.id)

        if (Object.keys(event).length <= 0) {
            return
        }

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
            <div class="col" style="width: 100%">
                <div class="content-wrapper row">
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
                            ${event.desc.replaceAll("\n", "<br>")}
                        </p>     
                    </div>
                    <img class="event-image" src="../img/sample.jpg">
                </div>
                <div class="row tools" style="place-content: end;"></div>
            </div>`)


        const badges = ev.find(".badges")

        ev.find(".pfp").on("click", async () => {
            window.location.href = "../user/index.html?u=" + username
        })

        if (user.accentColor) {
            ev.find(".pfp").css("borderColor", user.accentColor)
        }

        const readOnly = await u.getMemberReadOnly(auth.currentUser.uid)



        if (readOnly.admin) {

            const more = new MoreMenu()

            if (pinned) {
                more.add("Unpin", async () => {
                    await this.unpin(u)
                    alert("Event unpinned, refresh your page to see updates")
                })
            }
            else {
                more.add("Pin", async () => {
                    await this.pin(u)
                    alert("Event pinned, refresh your page to see updates")
                })
            }

            more.add("Delete", async () => {
                if (confirm("Are you sure you want to delete this event?")) {
                    await this.delete()
                    ev.css("display", "none")
                }
            })
            ev.find(".tools").append(more.more)
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

        if (pinned) {
            if (user.accentColor) {
                ev.css("borderColor", user.accentColor)
            }
            else {
                ev.css("borderColor", "var(--accent)")
            }
        }

        try {
            ev.find(".event-image").attr("src", await this.bucket.getImage("preview.jpg"))
        }
        catch {
            ev.find(".event-image").css("display", "none")
        }

        ev.find(".pfp").attr("src", await u.getPfp())


        const open = $("<img/>").attr("src", "../img/icons/arrow.png")

        open.on("click", () => {
            window.location.href = "../event/index.html?e=" + this.id
        })

        ev.find(".tools").append(open)

        content.append(ev)

    }

    async getUData() {
        return await getDocs(query(collection(db, "posts", this.id, "uData")))
    }

    async getUDataMember(uid) {
        let e = await getDoc(doc(db, "posts", this.id, "uData", uid))

        if (!e.exists()) {
            console.error("Could not user UData with id: " + this.id)
            return {}
        }


        let eventData = e.data()

        return eventData
    }

    async getImage(url) {
        return await this.bucket.getImage(url)
    }

    async setImage(file, name) {
        await this.bucket.uploadImage(file, name)
    }

    async update(data) {
        await setDoc(doc(db, "posts", this.id), data, { merge: true })
    }

    async updateUData(memberId, data) {
        await setDoc(doc(db, "posts", this.id, "uData", memberId), data, { merge: true })

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

    async delete() {
        const q = await getDocs(query(collection(db, "posts", this.id, "uData")));

        q.forEach(async (d) => {
            await deleteDoc(doc(db, "posts", this.id, "uData", d.id));
        });

        await deleteDoc(doc(db, "posts", this.id));
    }

    async pin(group) {
        await group.updateData({ pinned: { id: this.id, path: "posts" } }, "public")
    }

    async unpin(group) {
        await group.updateData({ pinned: null }, "public")
    }
}

export class User {
    constructor(uid) {
        this.uid = uid
        this.bucket = new ImageBucket(uid);
    }


    async getEvents() {
        return await getDocs(query(collection(db, "posts"), where("creator", "==", this.uid)))
    }

    async getUpdates() {
        return await getDocs(query(collection(db, "updates"), where("creator", "==", this.uid)))

    }

    async deleteMembers() {
        const m = await getDocs(query(collection(db, "users", this.uid, "members")))


        m.forEach(async (member) => {
            const id = member.id

            await deleteDoc(doc(db, "users", this.uid, "members", id))
            await deleteDoc(doc(db, "users", this.uid, "members", id, "readOnly", "data"))

        })
    }

    async deleteEvents() {
        const e = await this.getEvents()

        e.forEach(async (event) => {
            const id = event.id

            await deleteDoc(doc(db, "posts", id))
        })
    }

    async deleteUpdates() {
        const e = await this.getUpdates()

        e.forEach(async (update) => {
            const id = update.id

            await deleteDoc(doc(db, "updates", id))
        })
    }

    async delete() {
        if (!confirm("Are you sure you want to delete this account?") || !confirm("THIS CANNOT BE UNDONE ARE YOU SURE YOU WANT TO DELETE IT?")) {
            return
        }
        await deleteDoc(doc(db, "users", this.uid))

        await deleteDoc(doc(db, "users", this.uid, "data", "public"))
        await deleteDoc(doc(db, "users", this.uid, "data", "private"))
        const uname = await this.getUsername()
        await deleteDoc(doc(db, "usernames", this.uid))
        await deleteDoc(doc(db, "uids", uname))

        await this.deleteEvents()
        await this.deleteUpdates()
        await this.deleteMembers()

        await this.bucket.removeImages();


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

    async getPfp() {
        return await this.bucket.getImage("pfp.jpg")
    }

    async setPfp(file) {
        await this.bucket.uploadImage(file, "pfp.jpg")
    }

    async getGallery() {
        return await this.bucket.getAllFolders("gallery")
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

    async getMembers() {

        return await getDocs(query(collection(db, "users", this.uid, "members"), where("joined", "==", true)))

    }

    static async display(uname, pub, meta, content = $("#content"), groupAdmin = false) {


        const uObj = new User(await User.getUID(uname))


        const user = $("<div/>")
            .addClass("user")
            .addClass("row")
            .css("gap", 0)
            .css("flex-wrap", "nowrap")
            .css("width", "calc(100% - 40px)")
            .css("place-content", "start")
            .css("place-items", "start")


        const r = $("<div/>").addClass("row").css("width", "100%").css("place-content", "start").css("place-items", "start")


        const pfp = $("<img/>")
            .addClass("pfp")
            .addClass("border")
            .attr("src", "../img/pfp.jpg")

        pfp.attr("src", await uObj.getPfp())

        pfp.on("click", async () => {
            window.location.href = "../user/index.html?u=" + await uObj.getUsername()
        })


        if (pub.accentColor) {
            pfp.css("border-color", pub.accentColor)
        }

        const userDetails = $("<div/>")
            .addClass("col")

        const userRow = $("<div/>")
            .addClass("row")
            .css("width", "100%")
            .css("flex-wrap", "wrap")
            .css("place-content", "start")
            .css("gap", "5px")


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

        const desc = $("<p/>").html(pub.desc.replaceAll("\n", "<br>"))

        userDetails.append(userRow)
        userDetails.append(badges)
        userDetails.append(desc)

        r.append(pfp)
        r.append(userDetails)

        user.append(r)

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

    async getEmail() {
        let r = await getDoc(doc(db, "emails", this.uid))

        if (!r.exists()) {
            console.error("Could not load email from uid: " + this.uid)
            return
        }

        return r.data().email
    }

    async notify(subject, text, url, fromGroupId) {
        await addDoc(collection(db, "notifs"), {
            bccUids: [this.uid],
            groupId: fromGroupId,
            url: url,
            message: {
                subject: `${subject}`,
                text: text,
                html: `<p>${text}<p/><br><a href="${url}" style="border-radius: 15px; font-family: sans-serif; text-decoration: none; color: white; background-color: #a353b9; padding: 10px;">View on Lokal</a>`
            }
        })
    }

    async getNotifs() {
        return await getDocs(query(collection(db, "notifs"), where("bccUids", "array-contains", this.uid)))
    }
    async getNotif(id) {
        let r = await getDoc(doc(db, "notifs", id))

        if (!r.exists()) {
            console.error("Could not load notif from uid: " + id)
            return
        }

        return r.data()
    }

    async removeNotif(id) {
        const notif = await this.getNotif(id)

        const i = notif.bccUids.indexOf(this.uid)

        notif.bccUids.splice(i, 1)

        await setDoc(doc(db, "notifs", id), {
            bccUids: notif.bccUids
        }, { merge: true })

        $("#" + id).remove()
    }

    async notifyAllMembers(subject, text, url) {
        const members = await this.getMembers()

        console.log(members)

        const uids = []

        members.forEach(async (m) => {
            const member = new User(m.id)
            const pub = await member.getData("public")

            if (pub.notifs) {
                uids.push(m.id)
            }
        })
        // batch send

        await addDoc(collection(db, "notifs"), {
            bccUids: uids,
            groupId: this.uid,
            url: url,
            message: {
                subject: `@${await this.getUsername()} ${subject}`,
                text: text,
                html: `<p>${text}<p/><br><a href="${url}" style="border-radius: 15px; font-family: sans-serif; text-decoration: none; color: white; background-color: #a353b9; padding: 10px;">View on Lokal</a>`
            }
        })
    }

    async notifyMember(memberId, subject, text, url) {
        await addDoc(collection(db, "notifs"), {
            bccUids: [memberId],
            groupId: this.uid,
            url: url,
            message: {
                subject: `@${await this.getUsername()} ${subject}`,
                text: text,
                html: `<p>${text}<p/><br><a href="${url}" style="border-radius: 15px; font-family: sans-serif; text-decoration: none; color: white; background-color: #a353b9; padding: 10px;">View on Lokal</a>`
            }
        })
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
        await user.updateData({
            ...pub,
            timestamp: Timestamp.now()
        }, "public")

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

        if (value.length > 20) {
            return name + " cannot be over 20 chars long"
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

    static async sleep(ms) {
        await new Promise(r => setTimeout(r, ms));
    }

    static getVersion() {
        return "Lokal v11"
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

    static logMetric(name) {
        logEvent(analytics, name)
    }
}

export class Dropdown {
    constructor(id) {
        this.menu = $("<select/>").attr("id", id)

    }

    addOption(text) {
        this.menu.append($("<option/>").text(text).attr("id", text))
    }

    removeOption(text) {
        this.menu.find(`#${text}`).remove()
    }
}

export class MoreMenu {
    constructor() {
        this.more = $("<div/>")
            .addClass("moreMenu")
        this.menu = $("<div/>")
            .addClass("menu")

        this.clicked = false

        this.button = $("<img/>")
            .attr("src", "../img/icons/more.png")
            .css("width", 35)
            .css("height", 35)
            .on("click", async () => {

                this.menu.css("opacity", 1)
                this.menu.css("display", "flex")

                await new Promise(r => setTimeout(r, 500));

                document.onclick = () => {
                    this.menu.css("opacity", 0)
                    this.menu.css("display", "none")

                    document.onclick = () => { }

                }
            })

        this.more.append(this.button)
        this.more.append(this.menu)
    }

    add(label, onclick) {

        const button = $("<div/>")
            .text(label)
            .on("click", () => {
                if (onclick) {
                    onclick()
                }
            })

        this.menu.append(button)

        return button;
    }


}

export class Calendar {
    constructor(data = null) {
        const today = new Date();

        this.currentYear = today.getFullYear();  // Gets the current year (e.g., 2025)
        this.currentMonth = today.getMonth() + 1;  // Gets the current month (1-12, adding 1 since getMonth() is 0-based)
        this.currentDay = today.getDate();  // Gets the current day of the month (1-31)

        if (data) {
            this.data = data
            return
        }

        this.data = {}
        for (let year = 2020; year < 2100; year++) {
            this.data[year] = {}
            for (let month = 1; month <= 12; month++) {
                this.data[year][month] = {}

                let daysInMonth = new Date(year, month, 0).getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    this.data[year][month][day] = {
                        events: []
                    };
                }

            }
        }

    }

    getMonthName(monthNumber) {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        return months[monthNumber - 1] || "Invalid month"; // Adjust for 1-based input
    }

    addEvent(year, month, day, eventId) {
        this.data[year][month][day].events.push(eventId)
    }

    display(content = $("#content")) {
        const calandar = $("<div/>")
            .addClass("col")
            .addClass("calandar")
            .css("gap", "0")

        const top = $("<div/>")
            .addClass("row")
            .addClass("top")

        const left = $("<img/>")
            .addClass("tool")
            .attr("src", "../img/icons/left.png")
            .css("margin-right", "auto")

        top.append(left)

        const col = $("<div/>")
            .addClass("col")
            .css("place-items", "center")

        const month = $("<h3/>").text(this.getMonthName(this.currentMonth))

        const year = $("<h4/>").text(this.currentYear)

        col.append(month).append(year)

        top.append(col)

        const right = $("<img/>")
            .addClass("tool")
            .attr("src", "../img/icons/right.png")
            .css("margin-left", "auto")

        top.append(right)

        calandar.append(top)

        const weeks = $("<div/>")
            .addClass("weeks row")

        const weeksArray = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

        weeksArray.forEach(w => {
            weeks.append($("<h4/>").addClass("week").text(w))
        });

        calandar.append(weeks)

        const days = $("<div/>")
            .addClass("days grid")

        calandar.append(days)

        const s = this

        function offset(num) {
            for (let i = 0; i < num; i++) {
                days.append($("<div/>").addClass("day").append($("<span/>").text("test")))
            }
        }

        function refreshDays() {
            month.text(s.getMonthName(s.currentMonth))
            year.text(s.currentYear)

            days.html("")

            const monthsDays = s.data[s.currentYear][s.currentMonth]

            Object.keys(monthsDays).forEach((d) => {
                if (d == 1) {
                    const off = new Date(`${s.currentYear}-${s.currentMonth}-${d}`).getDay()
                    offset(off)

                }
                const dayData = monthsDays[d]

                const day = $("<div/>")
                    .addClass("day")

                const dayNum = $("<span/>").text(d).addClass("dayNum")
                day.append(dayNum)

                if (Object.keys(dayData.events).length > 0) {
                    const eventsBanner = $("<span/>")
                        .text(`${Object.keys(dayData.events).length} Events`)
                        .addClass("banner")
                        .css("background-color", "var(--accent)")
                    if (window.innerWidth < 600) {
                        eventsBanner
                            .text(`${Object.keys(dayData.events).length}`)

                    }

                    day.append(eventsBanner)
                }

                days.append(day)
            })
        }
        refreshDays(s)

        right.on("click", () => {
            if (s.currentYear < 2099 || s.currentMonth < 12) {
                s.currentMonth += 1
                if (s.currentMonth > 12) {

                    s.currentMonth = 1
                    s.currentYear += 1
                }
                refreshDays()
            }
        })

        left.on("click", () => {
            if (s.currentYear > 2020 || s.currentMonth > 1) {
                s.currentMonth -= 1
                if (s.currentMonth < 1) {

                    s.currentMonth = 12
                    s.currentYear -= 1
                }
                refreshDays()
            }
        })

        content.append(calandar)

        const heading = $("<h3/>").text("Key:")

        content.append(heading)

        const key = $("<div/>")
            .addClass("grid key")

        function addItem(label, color) {
            key.append($("<span/>").text(label).css("background-color", color))
        }

        addItem("Events", "var(--accent)")

        content.append(key)

    }
}


export class ImageBucket {
    constructor(id, type) {
        this.id = id
        this.type = type
        this.typeName = "users"

        if (type == "EVENT") {
            this.typeName = "posts"
        }
    }

    async getImage(url) {
        const r = ref(imgDB, `${this.typeName}/${this.id}/${url}`)

        return await getDownloadURL(r)
    }

    async getImageFromRef(r) {
        return await getDownloadURL(r)
    }

    async uploadImage(file, name) {
        const r = ref(imgDB, `${this.typeName}/${this.id}/${name}`)

        await uploadBytes(r, file)
    }

    async createBlob(r) {
        const response = await fetch(await getDownloadURL(r), {
            method: "GET",
            mode: "cors"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        return blob
    }

    async moveImages(from, to) {
        const images = await this.getAllImages(ref(imgDB, `${this.typeName}/${this.id}/${from}`))

        images.forEach(async (imageRef) => {
            console.log(1)

            const blob = await this.createBlob(imageRef)

            console.log(imageRef.name)


            await this.uploadImage(new File([blob], imageRef.name, { "type": blob.type }), `${to}/${imageRef.name}`)
        })
    }

    async removeImages() {
        const r = ref(imgDB, `${this.typeName}/${this.id}/`)

        listAll(r)
            .then((res) => {
                res.items.forEach((itemRef) => {
                    deleteObject(itemRef).then(() => {
                        // File deleted successfully
                    }).catch((error) => {
                        // Uh-oh, an error occurred!
                    });
                });
            }).catch((error) => {
                // Uh-oh, an error occurred!
            })

    }

    async removeImage(path) {
        const r = ref(imgDB, `${this.typeName}/${this.id}/${path}`)

        await deleteObject(r)
    }

    async removeImagesFromPath(path) {
        const r = ref(imgDB, `${this.typeName}/${this.id}/${path}`)

        listAll(r)
            .then((res) => {
                res.items.forEach((itemRef) => {
                    deleteObject(itemRef).then(() => {
                        // File deleted successfully
                    }).catch((error) => {
                        // Uh-oh, an error occurred!
                    });
                });
            }).catch((error) => {
                // Uh-oh, an error occurred!
            })

    }

    async getAllFolders(url) {
        const r = ref(imgDB, `${this.typeName}/${this.id}/${url}`)

        const list = []

        const res = await listAll(r)

        res.prefixes.forEach((itemRef) => {
            list.push(itemRef)
        });

        return list;
    }

    async getAllImages(re) {
        const r = re

        const list = []

        const res = await listAll(r)

        res.items.forEach((itemRef) => {
            list.push(itemRef)
        });

        return list;
    }
}


export class ImageViewer {
    constructor(photos, startIndex = 0) {
        this.content = $("<div/>").attr("id", "imageViewer")

        this.bg = $("<div/>").attr("id", "bg")

        this.index = startIndex;

        this.photos = photos

        const topBar = $("<div/>").addClass("tools")

        const exit = $("<img/>").attr("src", "../img/icons/x.png")

        topBar.append(exit)

        topBar.append($("<h3/>").text(photos[startIndex].name).css("height", "fit-content"))

        exit.on("click", () => {
            this.delete()
        })

        const row = $("<div/>").addClass("row")

        topBar.append(row)

        const download = $("<img/>").attr("src", "../img/icons/download.png")

        row.append(download)

        download.on("click", () => {
            const a = $("<a/>").attr("href", photos[startIndex].url).attr("target", "_blank")
            a[0].download = true
            a[0].click()

            a.remove()
        })

        this.content.append(topBar)

        const midRow = $("<div/>").addClass("row midrow")

        const left = $("<img/>").attr("src", "../img/icons/left.png").addClass("tool").css("margin-right", "auto")

        left.on("click", () => {
            this.moveLeft()
        })

        this.image = $("<img/>").attr("src", photos[startIndex].url).addClass("image")

        const right = $("<img/>").attr("src", "../img/icons/right.png").addClass("tool").css("margin-left", "auto")

        right.on("click", () => {
            this.moveRight()
        })

        midRow.append(left)
        midRow.append(this.image)
        midRow.append(right)

        document.onkeyup = (ev) => {
            if (ev.code == "ArrowRight") {
                this.moveRight()
            }

            if (ev.code == "ArrowLeft") {
                this.moveLeft()
            }

            if (ev.code == "Escape") {
                this.delete()
            }
        }



        this.content.append(midRow)

        $(document.body).append(this.bg)
        $(document.body).append(this.content)
    }

    delete() {
        this.bg.remove()
        this.content.remove()
    }

    moveRight() {
        if (this.index + 1 < this.photos.length) {
            this.index += 1
            this.image.attr("src", this.photos[this.index].url)
        }
    }

    moveLeft() {
        if (this.index - 1 >= 0) {
            this.index -= 1
            this.image.attr("src", this.photos[this.index].url)
        }
    }
}

// export class CSV {
//     static async import(csv) {
//         return $.csv.toObjects(csv);
//     }
// }