
// elements
const sidebar = document.getElementById("sidebar")
const searchBox = document.getElementById("search-box")

function addItem(label, img, href, action) {
    const link = document.createElement("a")
    if (href != null) {link.href = href}

    if (action != null) {link.onclick = () => action()}
    
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

addItem("Feed", "../img/icons/foryou.png", "../")
addItem("Host Event", "../img/icons/host.png", "../host")
addItem("My Events", "../img/icons/events.png", "../events")
addItem("Profile", "../img/icons/profile.png", "../user")
