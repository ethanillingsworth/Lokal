import { getDoc, doc, getDocs, deleteDoc, setDoc, query, collection, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { Event, MoreMenu, Prompt, User } from "./funcs.js";

const urlParams = new URLSearchParams(window.location.search)


const content = $("#content")

const modal = $("<div/>").addClass("modal")

content.append(modal)

const e = new Event(urlParams.get("e"))

const data = await e.get()


const row = $("<div></div>")
    .addClass("row")
    .css("width", "100%")
    .css("placeContent", "start");

const title = $("<h2/>").text(data.title)

document.title = `Lokal - ${data.title}`

row.append(title)

const user = new User(data.creator)

const username = await user.getUsername()


const uname = $("<h3/>").text(`(@${username})`)
    .css("color", "gray")

row.append(uname)

const tools = $("<div/>").addClass("row").addClass("tools")

modal.append(row)

const preview = $("<img/>").addClass("event-image")

if (data.preview) {
    preview.attr("src", data.preview)
    modal.append(preview)
}

modal.append(tools)

const tabs = $("<div></div>")
    .addClass("row")
    .addClass("tabList")
    .css("placeContent", "start")
    .css("position", "relative")
    .css("top", "10px")
    .css("gap", "20px");

const linkAlert = new Prompt("Select options for your link")

linkAlert.addField("Auto Attend:", (row) => {
    const select = $("<select></select>")
        .attr("id", "select")
        .html(`
            <option value="true">True</option>
            <option value="false">False</option>
        `);

    row.append(select.get(0));
});

linkAlert.setDoneFunction(async () => {
    let href = window.location.href

    if ($("#select").val() == "true") {
        href += "&autoJoin=true"
    }

    await navigator.clipboard.writeText(href)
})

const currentUser = new User(auth.currentUser.uid)

const badges = await currentUser.getBadges()

const hr = $("<hr></hr>")


modal.append(tabs)

modal.append(hr)

addPage("Public View", async (page) => {
    const date = $("<h4></h4>").text(`Date: ${new Date(data.date).toLocaleDateString("en-US")}`);
    const location = $("<h4></h4>").text(`Location: ${data.location}`);
    const cost = $("<h4></h4>");

    if (data.cost > 0) {
        cost.text(`Cost: ${data.cost}`);
        page.append(cost);
    }

    page.append(date);
    page.append(location);

    const desc = $("<p></p>").html(`<b>Summary:</b> ${data.desc}`);
    page.append(desc);

    page.append($("<hr></hr>"));

    const buttons = $("<div></div>")
        .addClass("row")
        .addClass("actions")
        .css("place-content", "start");

    page.append(buttons);

    let attending = 0;
    let selfAttend = false;

    function addButton(label, src, id, after) {
        const button = $("<button></button>")
            .addClass("action")
            .attr("id", id);

        const image = $("<img>").attr("src", src);
        const span = $("<span></span>").text(label);

        button.append(image);
        button.append(span);
        buttons.append(button);
        button.css("border", "3px solid transparent");

        if (auth.currentUser.uid != data.creator) {
            after(button, span);
        }
    }

    const uData = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData")));

    uData.forEach(doc => {
        const data = doc.data();

        if (data.attending) attending += 1;

        if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
    });

    addButton(`${attending} Attending`, "../img/icons/profile.png", "attend", (button, span) => {
        if (selfAttend) {
            button.addClass("active");

        }

        button.on("click", async function () {
            if (selfAttend) {
                selfAttend = false;
                button.removeClass("active");
                attending -= 1;
            } else {
                selfAttend = true;
                button.addClass("active");
                attending += 1;
            }

            await setDoc(doc(db, "posts", urlParams.get("e"), "uData", auth.currentUser.uid), {
                attending: selfAttend
            });
            span.text(`${attending} Attending`);
        });
    });

    page.append($("<hr></hr>"));

    if (urlParams.get("autoJoin") && !selfAttend) {
        $("#attend").trigger("click");
    }

    const agendaHeading = $("<h3></h3>").html("<b>Agenda:</b>");
    page.append(agendaHeading);

    const agenda = $("<p></p>").html(data.agenda);
    page.append(agenda);
}, true);

const creator = new User(data.creator)

const readOnly = await creator.getMemberReadOnly(currentUser.uid)

if (currentUser.uid == data.creator || readOnly.admin || badges.includes("admin")) {

    const more = new MoreMenu()

    more.add("Share", function () {
        linkAlert.show();
    })
    more.add("Edit", function () {
        window.location.href = "../host/index.html?e=" + urlParams.get("e");
    })

    more.add("Delete", async function () {
        if (confirm("Are you sure? Deleting an event cannot be undone!")) {

            const q = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData")));

            q.forEach(async (d) => {
                await deleteDoc(doc(db, "posts", urlParams.get("e"), "uData", d.id));
            });

            await deleteDoc(doc(db, "posts", urlParams.get("e")));

            window.location.href = "../";
        }
    })

    tools.append(more.more);

    addPage("Attendance", async (page) => {
        const grid = $("<div></div>").addClass("grid");

        const displayNameHeading = $("<h4></h4>").text("Display Name:");
        const usernameHeading = $("<h4></h4>").text("Username:");
        const attendingStatusHeading = $("<h4></h4>").text("Here:");

        if (window.innerWidth > 512) {
            grid.append(displayNameHeading);
        }
        grid.append(usernameHeading);
        grid.append(attendingStatusHeading);

        const uData = await getDocs(query(collection(db, "posts", urlParams.get("e"), "uData"), where("attending", "==", true)));

        uData.forEach(async (d) => {
            const usernameElem = $("<h4></h4>");
            const displayElem = $("<h4></h4>");
            const attendingElem = $("<div></div>").addClass("row");

            const here = $("<input>")
                .attr("type", "checkbox")
                .prop("checked", d.data().here)
                .on("change", async () => {
                    await setDoc(doc(db, "posts", urlParams.get("e"), "uData", d.id), {
                        here: here.prop("checked")
                    }, { merge: true });
                });

            usernameElem.css("font-weight", "normal");
            displayElem.css("font-weight", "normal");

            usernameElem.text("N/A");

            const usernameRef = await getDoc(doc(db, "usernames", d.id));

            if (usernameRef.exists()) {
                usernameElem.text("@" + usernameRef.data().username);
            }

            const publicRef = await getDoc(doc(db, "users", d.id, "data", "public"));

            if (publicRef.exists()) {
                displayElem.text(publicRef.data().displayName);
            }

            attendingElem.append(here);

            if (window.innerWidth > 512) {
                grid.append(displayElem);
            } else {
                grid.css("grid-template-columns", "1fr 1fr");
            }

            grid.append(usernameElem);
            grid.append(attendingElem);
        });

        page.append(grid);
    });

}

function addPage(label, func, current) {
    const tab = $("<button></button>")
        .addClass('tab')
        .text(label);

    tabs.append(tab);

    const page = $("<div></div>")
        .addClass("page");

    if (current) {
        page.addClass("currentPage");
    }

    if (current) {
        tab.addClass("current");
    }

    modal.append(page);

    tab.on("click", () => {
        switchPage(page, tab);
    });

    func(page);
}

function switchPage(page, tab) {
    $(".tab").removeClass("current");
    $(".page").removeClass("currentPage");

    page.addClass("currentPage");
    tab.addClass("current");
}


