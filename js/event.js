import { doc, getDocs, deleteDoc, setDoc, query, collection, where, deleteField } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";


import { auth, db } from "./firebase.js";
import { Dropdown, Event, graphColors, MoreMenu, User, CSS, PostPopup, log } from "./funcs.js";

CSS.loadFiles(["../css/event.css"])

const params = new URLSearchParams(window.location.search);

if (params.has('e')) {
    const id = params.get('e');
    // Redirect to the new format /event/id
    window.location.replace(`/event/${id}`);
}

const path = window.location.pathname;

const pageEvent = path.split('/').pop();

const content = $("#content")

const modal = $("<div/>").addClass("modal")

content.append(modal)

const e = new Event(pageEvent)

const data = await e.get()


const row = $("<div></div>")
    .addClass("row")
    .css("width", "100%")
    .css("placeContent", "start")
    .css("flex-wrap", "wrap")

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

const preview = $("<img/>").addClass("event-image").css("place-self", "center")

try {
    preview.attr("src", await e.bucket.getImage("preview.jpg"))
    modal.append(preview)
}
catch { }

modal.append(tools)

const tabs = $("<div></div>")
    .addClass("row")
    .addClass("tabList")
    .css("placeContent", "start")
    .css("position", "relative")
    .css("top", "10px")
    .css("gap", "20px");


const currentUser = new User(auth.currentUser.uid)

const badges = await currentUser.getBadges()

const hr = $("<hr></hr>")


modal.append(tabs)

modal.append(hr)


const creator = new User(data.creator)

const currentUData = await e.getMemberUData(currentUser.uid)

const readOnly = await creator.getMemberReadOnly(currentUser.uid)

if (!readOnly.accepted && !badges.includes("admin")) {
    alert("You have to join the group associated with this event before viewing!")
    window.location.href = `/${window.getSchool()}/user/${await creator.getUsername()}`
}


addPage("Public View", async (page) => {
    const date = $("<h4></h4>").text(`Date: ${new Date(data.date).toLocaleDateString("en-US")}`);
    const location = $("<h4></h4>").text(`Location: ${data.location}`);
    const cost = $("<h4></h4>");
    let act = []

    if (data.actions) {
        act = data.actions
    }

    if (data.cost > 0) {
        cost.text(`Cost: $${data.cost}`);
        page.append(cost);
    }

    page.append(date);
    page.append(location);

    const desc = $("<p></p>").html(`<b>Summary:</b> ${data.desc.replaceAll("\n", "<br>")}`);
    page.append(desc);

    page.append($("<hr></hr>"));

    const actions = $("<div/>").addClass("col actionsWrapper").css("gap", "5px")

    const buttons = $("<div></div>")
        .addClass("row")
        .addClass("actions")
        .css("place-content", "start");


    const tools = $("<div/>").addClass("tools").css("margin-left", "auto")
    if (readOnly.admin || badges.includes("admin")) {
        const menu = new MoreMenu()

        menu.button.css("width", "30px")
        menu.button.css("height", "30px")


        menu.add("Add Dropdown", async () => {
            const label = prompt("Label for dropdown (leave blank for no label):")
            act.push({
                "label": label,
                "type": "DROPDOWN",
                "options": ["None"],
                "defaultOption": "None"
            })

            await addDropdown(act.length - 1)

            await e.update({
                "actions": act
            })

        })

        tools.append(menu.more)
    }

    page.append(buttons);
    function showActions() {
        actions.html("")
        act.forEach((a, index) => {
            if (a.type == "DROPDOWN") { addDropdown(index) }
        })
    }

    if (currentUData.attending || readOnly.admin) {
        showActions()
    }

    page.append(actions)

    let attending = 0;
    let selfAttend = false;

    async function addDropdown(index) {
        const data = act[index]
        const row = $("<div></div>")
            .addClass("row")
            .addClass("actions")
            .css("place-content", "start");

        const label = $("<h4/>").text(data.label)

        row.append(label)

        const dropdown = new Dropdown(data.label.replaceAll(" ", ""))
        for (const opt of data.options) {
            dropdown.addOption(opt)
        }


        if (currentUData[data.label]) {

            if (currentUData[data.label] == "") {
                dropdown.menu.val(data.defaultOption)
            }
            dropdown.menu.val(currentUData[data.label])
        }
        else {
            await e.updateMemberUData(currentUser.uid, {
                [data.label]: data.defaultOption
            })
        }

        dropdown.menu.on("change", async () => {

            await e.updateMemberUData(currentUser.uid, {
                [data.label]: dropdown.menu.val()
            })
            console.log("updated")
        })

        row.append(dropdown.menu)

        const tools = $("<div/>").addClass("tools").css("margin-left", "auto")

        if (readOnly.admin || badges.includes("admin")) {

            const menu = new MoreMenu()

            menu.add("Add Option", async () => {
                const option = prompt("Please type the option you'd like to add")
                if (option.length < 1 || option.length > 25) {
                    alert("Option is too long or short! (less than 1 char or over 25 chars)")
                    return
                }
                console.log(index)
                data.options.push(option)

                dropdown.addOption(option)
                await e.update({
                    "actions": act
                })
            })

            menu.add("Remove Selected Option", async () => {
                dropdown.removeOption(dropdown.menu.val())
                const i = data.options.indexOf(dropdown.menu.val()) - 1
                data.options.splice(i, 1)
                if (i > 0) {
                    dropdown.menu.val(data.options[i])
                }
                await e.update({
                    "actions": act
                })
            })

            menu.add("Make Selected Option Default", async () => {
                data.defaultOption = dropdown.menu.val()
                alert(`${dropdown.menu.val()} is now the default option for this dropdown`)
                await e.update({
                    "actions": act
                })
            })
            // menu.add("Rename", async () => {
            //     const newLabel = prompt("Enter in the new label:")
            //     data.label = newLabel

            //     label.text(newLabel)


            //     await e.update({
            //         "actions": act
            //     })

            // })

            menu.add("Remove Dropdown", async () => {
                if (confirm("Are you sure you want to delete this?")) {
                    act.splice(index, 1)
                    row.remove()
                    await e.update({
                        "actions": act
                    })

                    const allUData = await e.getUData()

                    allUData.forEach(async (d) => {
                        await e.updateMemberUData(d.id, {
                            [data.label]: deleteField()
                        })
                    })
                }
            })

            tools.append(menu.more)
        }
        row.append(tools)
        actions.append(row)

    }

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



    const uData = await e.getUData()

    uData.forEach(doc => {
        const data = doc.data();

        if (data.attending) attending += 1;

        if (doc.id == auth.currentUser.uid && data.attending) selfAttend = true;
    });

    addButton(`${attending} Attending`, "../img/icons/profile.png", "attend", (button, span) => {
        if (selfAttend) {
            button.addClass("active");
            attending -= 1
            button.find("span").text(`${attending} Attending + You`)

        }

        button.on("click", async function () {
            if (selfAttend) {
                selfAttend = false;
                button.removeClass("active");
                actions.html("")
                button.find("span").text(`${attending} Attending`)


            } else {
                selfAttend = true;
                button.addClass("active");
                showActions()
                button.find("span").text(`${attending} Attending + You`)
            }

            log("rsvp_submitted", {
                event_id: e.id,
                user_id: auth.currentUser.uid,
                response: selfAttend ? "Going" : "Not Going",
                method: "website"
            })

            await setDoc(doc(db, "posts", pageEvent, "uData", auth.currentUser.uid), {
                attending: selfAttend,
                here: false
            });
        });
    });

    buttons.append(tools);

    page.append($("<hr></hr>"));

    if (params.get("autoJoin") && !selfAttend) {
        $("#attend").trigger("click");
    }

    const agendaHeading = $("<h3></h3>").html("<b>Agenda:</b>");
    page.append(agendaHeading);

    const agenda = $("<p></p>").html(data.agenda);
    page.append(agenda);
}, true);


addPage("RSVPs", async (page) => {
    const col = $("<div></div>").addClass("col");
    const none = $("<h3/>").text("No one has joined your event yet! Send out a link to them to get started")
    col.append(none)
    const userStats = $("<div></div>").addClass("col").css("display", "none");

    const uData = await getDocs(query(collection(db, "schools", window.getSchool(), "posts", pageEvent, "uData"), where("attending", "==", true)));

    uData.forEach(async (d) => {
        none.css("display", "none")

        const aUser = new User(d.id)
        const username = await aUser.getUsername()
        const pub = await aUser.getData("public")
        const meta = await aUser.getData("hidden")

        const userUData = await e.getMemberUData(d.id)


        const display = await User.display(username, pub, meta, col)

        const actions = display.find(".actions")

        function addAction(src, func) {
            actions.prepend($("<img/>")
                .attr("src", src)
                .addClass("action")

                .on("click", function () {
                    func()
                }));
        }

        function displayUserStats() {
            userStats.html("")

            const tools = $("<div/>").addClass("row tools").css("place-content", "start")

            const back = $("<img/>").attr("src", "../img/icons/left.png")

            back.on("click", () => {
                col.css("display", "flex")
                userStats.css("display", "none")
            })

            const grid = $("<div/>").addClass("grid")

            grid.append($("<h4/>").text("Key:"))

            grid.append($("<h4/>").text("Value:"))

            Object.keys(userUData).forEach((key) => {
                if (key != "attending") {
                    const value = userUData[key]

                    grid.append($("<h4/>").text(key))

                    if (typeof value == "boolean") {
                        const box = $("<input>").attr("type", "checkbox").attr("checked", value)
                        box.on("change", async () => {
                            console.log(box[0].checked)

                            await e.updateMemberUData(d.id, { [key]: box[0].checked })

                        })
                        grid.append($("<div/>").append(box))
                    }
                    else {

                        grid.append($("<h4/>").text(value))
                    }
                }
            })


            tools.append(back)

            userStats.append(tools)
            userStats.append(grid)

        }
        if (readOnly.admin || badges.includes("admin")) {
            addAction("../img/icons/stats.png", () => {
                userStats.css("display", "flex")
                col.css("display", "none")
                displayUserStats()
            })
        }

    })
    page.append(col)
    page.append(userStats)

});

if (currentUser.uid == data.creator || readOnly.admin || badges.includes("admin")) {

    const more = new MoreMenu()

    more.add("Edit", function () {
        new PostPopup(creator.uid, "Event", pageEvent).show()
    })

    more.add("Delete", async function () {
        if (confirm("Are you sure? Deleting an event cannot be undone!")) {

            const q = await getDocs(query(collection(db, "schools", window.getSchool(), "posts", pageEvent, "uData")));

            q.forEach(async (d) => {
                await deleteDoc(doc(db, "schools", window.getSchool(), "posts", pageEvent, "uData", d.id));
            });

            await deleteDoc(doc(db, "schools", window.getSchool(), "posts", pageEvent));

            window.location.href = `/${window.getSchool()}/events`;
        }
    })

    tools.append(more.more);

    addPage("Charts / Stats", async (page) => {
        const col = $("<div></div>").addClass("row").css("place-content", "start").css("gap", "20px");

        const none = $("<h3/>").text("No one has joined your event yet! Send out a link to them to get started")
        col.append(none)

        const uData = await e.getUData()

        function hereGraph() {
            none.css("display", "none")
            const canvas = document.createElement("canvas")

            const dat = {
                labels: [
                    "Here",
                    "Not here"
                ],
                datasets: [{
                    label: "here",
                    data: [0, 0],
                    backgroundColor: [graphColors[0], graphColors[1]],
                    hoverOffset: 4
                }]
            };

            const config = {
                type: 'pie',
                data: dat,
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: "Here:",
                            font: {
                                size: 32,
                                weight: 'bold',
                            },
                            color: '#fff'
                        }
                    }
                }
            };

            uData.forEach((d) => {
                const da = d.data()
                dat.datasets[0].data[da.here ? 0 : 1] += 1;
            })

            new Chart(canvas.getContext("2d"), config)
            col.append(canvas)
        }

        hereGraph()


        if (data.actions) {
            data.actions.forEach(async (a) => {
                none.css("display", "none")
                const key = a.label

                const canvas = document.createElement("canvas")

                const dat = {
                    labels: [
                    ],
                    datasets: [{
                        label: 'My First Dataset',
                        data: [],
                        backgroundColor: [],
                        hoverOffset: 4
                    }]
                };

                const config = {
                    type: 'pie',
                    data: dat,
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: a.label,
                                font: {
                                    size: 32,
                                    weight: 'bold',
                                },
                                color: '#fff'
                            }
                        }
                    }
                };

                dat.datasets[0].label = key
                const optionsIndex = {}

                a.options.forEach((v, index) => {
                    dat.labels.push(v)
                    dat.datasets[0].backgroundColor.push(graphColors[index])
                    dat.datasets[0].data.push(0)
                    optionsIndex[v] = index
                })


                uData.forEach((d) => {
                    const da = d.data()

                    dat.datasets[0].data[optionsIndex[da[key]]] += 1;
                })

                new Chart(canvas, config)

                col.append($(canvas))
            })
        }
        page.append(col)
    })

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;

        // Initialize start time when the user is logged in
        const startTime = Date.now(); // Record the start time

        const readOnly = await creator.getMemberReadOnly(userId)

        // Log time spent when tab is hidden or user navigates away
        const logTimeSpent = () => {
            const timeSpentMs = Date.now() - startTime;

            log('event_viewed', {
                user_id: userId,
                event_id: '12345', // replace with actual event ID
                time_spent_ms: timeSpentMs,
                role: readOnly.admin ? "Admin" : "Member"
            });
        };

        // Handle visibility change (tab change, close, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                logTimeSpent();
            }
        });

        // Also handle full page unload (just in case)
        window.addEventListener('beforeunload', () => {
            logTimeSpent();
        });
    }
});