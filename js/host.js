import { createEvent, getBase64, getEvent, toTitleCase, updateEvent } from "./funcs.js"
import { auth } from "./firebase.js"
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


const urlParams = new URLSearchParams(window.location.search)

const content = document.getElementById("content")

const modal = document.createElement("div")
modal.classList.add("modal")

let isPlaceholder = true


function addField(page, label, customFunc) {
    const row = document.createElement("div")
    row.classList.add("row")


    const lab = document.createElement("h3")
    lab.innerText = label

    row.append(lab)

    customFunc(row)

    page.querySelector(".cont").append(row)

}

function switchPage(name) {
    document.querySelectorAll(".pageh").forEach((page) => {
        page.classList.remove("currenth")
    })

    document.getElementById(name).classList.add("currenth")
}

function addPage(name, prev = null, next = null, current = false) {
    const page = document.createElement("div")
    page.id = name
    page.classList.add("pageh");

    const content = document.createElement("div")
    content.classList.add("cont")

    page.append(content)

    if (current) page.classList.add("currenth");

    const buttons = document.createElement("div")
    buttons.classList.add("row")
    buttons.id = "buttons"
    if (prev) {
        const p = document.createElement("button")
        p.id = "prev"

        p.innerText = "< " + prev
        p.onclick = function () {
            switchPage(prev)
        }

        buttons.append(p)
    }

    if (next) {
        const n = document.createElement("button")
        n.id = "next"

        n.innerText = next + " >"
        n.onclick = async function () {
            if (next == "Done") {
                const title = document.getElementById("title")
                const desc = document.getElementById("desc")

                const cate = document.getElementById("cate")
                const date = document.getElementById("date")
                const loc = document.getElementById("location")
                const cost = document.getElementById("cost")
                const preview = document.getElementById("preview")


                const agenda = document.getElementById("agenda")

                if (!loc.value) loc.value = "None"

                const data = {
                    title: title.value,
                    desc: desc.value,
                    category: cate.value,
                    date: date.value,
                    location: toTitleCase(loc.value),
                    cost: cost.valueAsNumber,
                    agenda: agenda.value.replaceAll("\n", "<br>"),

                }



                if (!isPlaceholder) {
                    data.preview = preview.src
                }


                // upload
                if (urlParams.get("e")) {
                    await updateEvent(urlParams.get("e"), data)

                    window.location.href = "../event/index.html?e=" + urlParams.get("e");

                }
                else {
                    data.timestamp = Timestamp.fromDate(new Date())
                    data.creator = auth.currentUser.uid
                    const id = await createEvent(data)

                    window.location.href = "../event/index.html?e=" + id
                }


            }
            else {

                switchPage(next)

            }
        }

        buttons.append(n)
    }


    page.append(buttons)

    modal.append(page)

    return page
}



const init = addPage("Details", null, "Agenda", true)

addField(init, "Title:", (row) => {
    const input = document.createElement("input")
    input.id = "title"
    input.value = "Event Name"
    input.maxLength = "25"

    input.onchange = () => {
        if (input.textLength < 1) {
            input.value = "Event Name"
        }
    }

    row.append(input)
})

addField(init, "Summary:", (row) => {
    row.style.placeItems = "start"
    row.style.flexDirection = "column"

    const txtDiv = document.createElement("div")
    txtDiv.style.width = "100%";

    const txtArea = document.createElement("textarea")
    txtArea.rows = "5"
    txtArea.value = "A summary for the event\n(displayed in the event preview)"
    txtArea.maxLength = "250"
    txtArea.id = "desc"


    const txtLimit = document.createElement("h5")
    txtLimit.style.textAlign = "right"
    txtLimit.style.color = "gray"

    txtLimit.innerHTML = '<span id="count" style="color: gray">0</span>/250'
    txtArea.oninput = () => {
        txtLimit.querySelector("span").innerText = txtArea.textLength
    }
    txtLimit.querySelector("span").innerText = txtArea.textLength

    txtArea.onchange = () => {
        if (txtArea.textLength < 10) {
            txtArea.value = "Your summary must be at least 10 characters"
        }
        txtLimit.querySelector("span").innerText = txtArea.textLength
    }


    txtDiv.append(txtArea)
    txtDiv.append(txtLimit)

    row.append(txtDiv)

})

addField(init, "Category:", (row) => {
    const cate = document.createElement("select")
    cate.id = "cate"

    const favs = ["Club Activity", "Sports", "Tech"]


    let categorys = ["Arts", "Community", "Club Activity", "Food & Drink", "Fitness",
        "Sports", "Music", "Workshops / Classes", "Family / Kids", "Tech", "Holidays",
        "Networking", "Activism", "Travel", "Conference", "Charity",
        "Community Service"]

    const fav = document.createElement("optgroup")
    fav.label = "Favorites"

    favs.forEach((e) => {
        categorys = categorys.filter(item => item !== e)

        const opt = document.createElement("option")
        opt.innerText = e
        fav.append(opt)
    })

    const group = document.createElement("optgroup")
    group.label = "Other Categorys"

    categorys.sort()

    categorys.forEach(element => {

        const opt = document.createElement("option")
        opt.innerText = element
        group.append(opt)

    });

    cate.append(fav)
    cate.append(group)

    cate.onchange = function () {
        console.log(cate.value)
    }

    row.append(cate)
})

addField(init, "Date:", (row) => {
    const date = document.createElement("input")
    date.id = "date"

    date.value = new Date().toLocaleDateString("en-US")

    date.onchange = function () {
        if (new Date(date.value) < new Date() || new Date(date.value) == "Invalid Date") {
            date.value = new Date().toLocaleDateString("en-US")
        }
        else {
            date.value = new Date(date.value).toLocaleDateString("en-US")
        }
    }

    row.append(date)
})

addField(init, "Cost:", (row) => {
    const inp = document.createElement("input");
    inp.id = "cost"
    inp.placeholder = "0"
    inp.value = "0"
    inp.type = "number"

    inp.onchange = function () {
        if (inp.valueAsNumber < 0) inp.value = 0;
        if (inp.valueAsNumber > 1000) inp.value = 1000;
    }


    row.append(inp)
})

// addField(init, "Tags:", (row) => {
//     row.style.placeItems = "start"
//     row.style.flexDirection = "column"

//     const inp = document.createElement("textarea");

//     inp.rows = 3;

//     inp.id = "tags"
//     inp.placeholder = "football, sports, pizza"


//     row.append(inp)
// })

const age = addPage("Agenda", "Details", "Image")

function wrapText(textarea, startTag, endTag) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (textarea.disabled) {
        return
    }

    // Get the selected text
    const selectedText = text.substring(start, end);

    // Replace the selected text with formatted text
    const formattedText = startTag + selectedText + endTag;
    textarea.value = text.substring(0, start) + formattedText + text.substring(end);

    // Reposition the cursor
    textarea.selectionStart = start;
    textarea.selectionEnd = start + formattedText.length;

    // Focus back on the textarea
    textarea.focus();

}

addField(age, "Agenda:", (row) => {
    row.style.placeItems = "start"
    row.style.flexDirection = "column"

    const txtDiv = document.createElement("div")
    txtDiv.style.width = "100%";

    const buttons = document.createElement('div')
    buttons.classList.add("row")
    buttons.className = "buttons"
    buttons.style.marginLeft = "auto"
    buttons.style.placeContent = "end"

    function addButton(name, func) {
        const button = document.createElement("button")
        button.innerText = name
        button.style.borderBottomLeftRadius = "0"
        button.style.borderBottomRightRadius = "0"
        button.style.borderBottom = "none"


        buttons.append(button)
        button.onclick = function () { func() }
    }

    const txtArea = document.createElement("textarea")
    txtArea.id = "agenda"
    txtArea.placeholder = `This is where you put a detailed run down of your plans for the event!
    
Use the formmating tools to make it look pretty.`
    txtArea.maxLength = "1000"

    txtArea.style.width = "500px"
    txtArea.style.height = "400px"

    txtArea.style.borderTopRightRadius = "0"

    const txtP = document.createElement("p")
    txtP.classList.add("inp")
    txtP.style.width = "500px"
    txtP.style.height = "400px"
    txtP.style.overflowY = "auto"
    txtP.style.display = "none"
    txtP.style.fontSize = "1em"
    txtP.style.borderTopRightRadius = "0"
    txtP.style.border = "3px solid var(--accent)";



    let showFinal = false

    addButton("View Output", () => {
        if (!showFinal) {
            txtArea.style.display = "none"
            txtArea.disabled = true
            txtP.style.display = "block"
            txtP.innerHTML = txtArea.value.replaceAll("\n", "<br>")

            showFinal = true
        }
        else {
            txtArea.disabled = false
            txtArea.style.display = "block"
            txtP.style.display = "none"
            showFinal = false
        }
    })

    addButton("Bold", () => {
        wrapText(txtArea, "<b>", "</b>")
    })
    addButton("Italic", () => {
        wrapText(txtArea, "<i>", "</i>")
    })
    addButton("Underline", () => {
        wrapText(txtArea, "<u>", "</u>")
    })


    const txtLimit = document.createElement("h5")
    txtLimit.style.textAlign = "right"
    txtLimit.style.color = "gray"

    txtLimit.innerHTML = '<span id="count" style="color: gray">0</span>/1000'

    txtArea.oninput = () => {
        txtLimit.querySelector("span").innerText = txtArea.textLength
    }
    txtLimit.querySelector("span").innerText = txtArea.textLength

    txtArea.onchange = () => {
        if (txtArea.textLength < 1) {
            txtArea.value = "This cannot be left blank!!"
        }
        txtLimit.querySelector("span").innerText = txtArea.textLength
    }

    txtDiv.append(buttons)
    txtDiv.append(txtArea)
    txtDiv.append(txtP)

    txtDiv.append(txtLimit)

    row.append(txtDiv)
})

const preview = document.createElement("img")
preview.id = "preview"
preview.src = "../img/placeholder.png"


const addImage = addPage("Image", "Agenda", "Location")

addImage.querySelector(".cont").append(preview)

addField(addImage, "Image Upload:", (row) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png, image/jpeg"
    input.name = "upload"
    input.id = "upload"

    input.onchange = async function () {
        const file = input.files[0]

        preview.src = await getBase64(file)

        isPlaceholder = false
    }

    const label = document.createElement("label")
    label.innerText = "Browse..."

    label.onclick = function () {
        input.click()
    }
    label.htmlFor = "upload"


    row.append(input)
    row.append(label)
})

const loc = addPage("Location", "Image", "Done")

const map = document.createElement("iframe")
map.id = "map"
map.src = "https://www.google.com/maps/embed/v1/place?q=''&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
map.width = 600
map.height = 350
map.style.border = "0px solid black"

loc.querySelector(".cont").append(map)

addField(loc, "Address:", (row) => {

    const newRow = document.createElement("div")
    newRow.classList.add("row")

    const input = document.createElement("input")
    input.id = "location"

    input.style.borderTopRightRadius = "0"
    input.style.borderBottomRightRadius = "0"

    input.placeholder = "Location / Address"

    newRow.append(input)
    newRow.style.flexWrap = "nowrap"
    newRow.style.height = "37.2px"
    newRow.style.gap = "0"

    const search = document.createElement("img")

    search.src = "../img/icons/search.png"
    search.style.width = "auto"
    search.style.height = "calc(100% - 10px)"
    search.style.padding = "10px"
    search.style.paddingTop = "5px"
    search.style.paddingBottom = "5px"
    search.style.border = "2px solid var(--dark0)"
    search.style.borderTopRightRadius = "15px"
    search.style.borderBottomRightRadius = "15px"
    search.id = "search"

    search.onclick = function () {
        map.src = `https://www.google.com/maps/embed/v1/place?q=${input.value.replaceAll(" ", "+")}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
    }



    newRow.append(search)

    row.append(newRow)

})


content.append(modal)

// load data if event id is present
if (urlParams.get("e")) {

    const title = document.getElementById("title")
    const desc = document.getElementById("desc")
    const category = document.getElementById("cate")
    const date = document.getElementById("date")
    const cost = document.getElementById("cost")
    const agenda = document.getElementById("agenda")
    const location = document.getElementById("location")


    const data = await getEvent(urlParams.get("e"))

    title.value = data.title
    desc.value = data.desc
    category.value = data.category
    date.value = data.date
    cost.value = data.cost
    agenda.value = data.agenda.replaceAll("<br>", "\n")
    location.value = data.location
    if (data.preview) {
        preview.src = data.preview

        isPlaceholder = false
    }

}