// debug only version
const ver = document.createElement("span")
ver.id = "ver"
ver.innerText = "build 24M11D13"
document.body.append(ver)


// elements
const sidebar = document.createElement("div")
sidebar.id = "sidebar"

document.body.append(sidebar)

const heading = document.createElement("h1")

heading.innerText = "Lokal"
heading.id = "heading"

sidebar.append(heading)


export function addItem(label, img, href, id) {
    const link = document.createElement("a")
    link.id = id
    if (href != null) {link.href = href}
    
    link.classList.add("item")

    const image = document.createElement("img")
    image.src = img
    image.classList.add("icon")

    const lab = document.createElement("h4")
    lab.innerText = label

    link.append(image)
    link.append(lab)


    sidebar.append(link)
}

addItem("Home", "../img/icons/home.png", "../")
addItem("Host Event", "../img/icons/plus.png", "../host")
addItem("My Events", "../img/icons/party.png", "../events")
// use user pfp
addItem("Profile", "../img/pfp.jpg", "../user", "user")


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