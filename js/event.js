import { getDoc, doc, getDocs, deleteDoc, setDoc, query, collection, where, Timestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search)


const content = document.getElementById("content")

const modal = document.createElement("div")


modal.classList.add("modal")

content.append(modal)


const d = await getDoc(doc(db, "posts", urlParams.get("e")))

if (d.exists()) {
    const data = d.data()

    const row = document.createElement("div")
    row.classList.add("row")
    row.style.width = "100%"
    row.style.placeContent = "start"
    
    const title = document.createElement("h2")

    title.innerText = data.title

    document.title = `Lokal - ${data.title}`

    row.append(title)

    const usernames = await getDoc(doc(db, "usernames", data.creator))

    if (usernames.exists()) {
        const username = usernames.data().username

        const uname = document.createElement("h3")

        uname.innerText = `(@${username})`
        uname.style.color = "gray"

        row.append(uname)
    }

    modal.append(row)

    const tabs = document.createElement("div")
    tabs.classList.add("row")
    tabs.style.placeContent = "start"
    tabs.style.position = "relative"
    tabs.style.top = "10px"
    tabs.style.gap = "20px"

    if (auth.currentUser.uid == data.creator) {
        const share = document.createElement("img")
        share.id = "share"
        share.src = "../img/icons/share.png"
        share.onclick = async function() {
            await navigator.clipboard.writeText(window.location.href)
            alert("Link copied to clipboard")
        }
        share.height = 35

        row.append(share)

        const edit = document.createElement("img")
        edit.id = "edit"
        edit.src = "../img/icons/edit.png"
        edit.onclick = function() {
            window.location.href = "../host/index.html?e=" + urlParams.get("e")
        }
        edit.height = 35

        row.append(edit)

        const del = document.createElement("img")
        del.id = "del"
        del.src = "../img/icons/del.png"
        del.onclick = async function() {
            if (confirm("Are you sure? Deleting an event cannot be undone!")) {

                const q = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData")))

                q.forEach(async (d) => {
                    await deleteDoc(doc(db, "posts", urlParams.get("e"), "uData", d.id))
                })

                await deleteDoc(doc(db, "posts", urlParams.get("e")))

                window.location.href = "../"
            }
        }
        del.height = 35

        row.append(del)

        modal.append(tabs)    
        
    }

    function addPage(label, func, current) {
        const tab = document.createElement("h4")
        tab.classList.add('tab')
        tab.innerText = label

        tabs.append(tab)

        const page = document.createElement("div")
        page.classList.add("page")

        if (current) page.classList.add("currentPage")

        if (current) tab.classList.add("current")

        modal.append(page)

        tab.onclick = () => {
            switchPage(page, tab)
        }

        func(page)
    }

    function switchPage(page, tab) {
        document.querySelectorAll(".tab").forEach(element => {
            element.classList.remove("current")
        });
        document.querySelectorAll(".page").forEach(element => {
            element.classList.remove("currentPage")
        });
        
        page.classList.add("currentPage")
        tab.classList.add("current")
    }

    const hr = document.createElement("hr")
    hr.style.position = "relative"
    hr.style.bottom = "4px"

    modal.append(hr)

    addPage("Public View", async (page) => {
        const date = document.createElement("h4")
        const location = document.createElement("h4")
        const cost = document.createElement("h4")

        date.innerText = `Date: ${new Date(data.date).toLocaleDateString("en-US")}`
        location.innerText = `Location: ${data.location}`
        if (data.cost > 0) {
            cost.innerText = `Cost: ${data.cost}`
            page.append(cost)
        }

        page.append(date)
        page.append(location)

        const desc = document.createElement("p")
        desc.innerHTML = `<b>Summary:</b> ${data.desc}`

        page.append(desc)

        page.append(document.createElement("hr"))

        const buttons = document.createElement("div")
        buttons.classList.add("row")
        buttons.classList.add("actions")
        buttons.style.placeContent = "start"

        page.append(buttons)

        let attending = 0;

        let selfAttend = false;

        function addButton(label, src, after) {
            const button = document.createElement("div")
            button.classList.add("action")

            const image = document.createElement("img")
            image.src = src

            const span = document.createElement("span")
            span.innerText = label

            button.append(image)
            button.append(span)

            buttons.append(button)
            button.style.border = "3px solid transparent"

            if (auth.currentUser.uid != data.creator) after(button, span)

        }

        const uData = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData")))

        uData.forEach(doc => {
            const data = doc.data()

            if (data.attending) attending += 1;

            if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
        });

        addButton(`${attending} Attending`, "../img/icons/profile.png", (button, span) => {
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
                await setDoc(doc(db, "posts", urlParams.get("e"), "uData", auth.currentUser.uid), {
                    attending: selfAttend
                })
                span.innerText = `${attending} Attending`;
                
            }

            
        })


        page.append(document.createElement("hr"))


        const agendaHeading = document.createElement("h3")
        agendaHeading.innerHTML = "<b>Agenda:</b>"
        page.append(agendaHeading)

        const agenda = document.createElement("p")

        agenda.innerHTML = data.agenda

        page.append(agenda)
    }, true)

    addPage("Attendance", async (page) => {
        const grid = document.createElement("div")
        grid.classList.add("grid")

        const displayNameHeading = document.createElement("h4")
        const usernameHeading = document.createElement("h4")
        const attendingStatusHeading = document.createElement("h4")

        displayNameHeading.innerText = "Display Name:"
        usernameHeading.innerText = "Username:"
        attendingStatusHeading.innerText = "Here:"

        grid.append(displayNameHeading)
        grid.append(usernameHeading)
        grid.append(attendingStatusHeading)

        const uData = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData"), where("attending", "==", true)))

        uData.forEach(async (d) => {
            const usernameElem = document.createElement("h4")
            const displayElem = document.createElement("h4")
            const attendingElem = document.createElement("div")
            attendingElem.classList.add("row")

            const here = document.createElement("input")

            here.type = "checkbox"

            if (d.data().here) {
                here.checked = true;
            }

            here.onchange = async () => {
                await setDoc(doc(db, "posts", urlParams.get("e"), "uData", d.id), {
                    here: here.checked
                }, {merge: true})
            }

            usernameElem.style.fontWeight = "normal"
            displayElem.style.fontWeight = "normal"


            usernameElem.innerText = "N/A"


            const usernameRef = await getDoc(doc(db, "usernames", d.id))

            if (usernameRef.exists()) {
                
                usernameElem.innerText = "@" + usernameRef.data().username
            }
            const publicRef = await getDoc(doc(db, "users", d.id, "data", "public"))

            if (publicRef.exists()) {
                displayElem.innerText = publicRef.data().displayName
            }

            attendingElem.append(here)

            grid.append(displayElem)

            grid.append(usernameElem)
            grid.append(attendingElem)


        })

        page.append(grid)
    })

    

}