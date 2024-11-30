import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDoc, doc, setDoc, getDocs, updateDoc, collection, addDoc, Timestamp, arrayUnion, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";


// debug only version
const ver = document.createElement("span")
ver.id = "ver"
ver.innerText = "BETA v1"
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

export function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}


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

                await display(eventId, eventData, userData, usrname)

            }

            

        };
    }

    async function display(id, event, user, username) {

        let cost = "Free admission";

        let attending = 0
        
        let selfAttend = false

        const uData = await getDocs(query(collection(db, "posts", id, "uData")))

        uData.forEach((doc) => {
            const data = doc.data()

            if (data.attending) {
                attending += 1
            }
            if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
        })

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

