import { Utils, Event, User, Update } from "./funcs.js"
import { auth } from "./firebase.js"
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


const urlParams = new URLSearchParams(window.location.search);

const mode = urlParams.get("mode") || "event"

const content = $("#content");

const modal = $("<div/>").addClass("modal");

let isPlaceholder = true;

function addField(page, label, customFunc) {
    const row = $("<div/>").addClass("row");

    const lab = $("<h3/>").text(label);

    row.append(lab);

    customFunc(row);

    page.find(".cont").append(row);
}

function switchPage(name) {
    $(".pageh").removeClass("currenth");
    $("#" + name).addClass("currenth");
}

function addPage(name, prev = null, next = null, current = false) {
    const page = $("<div/>").attr("id", name).addClass("pageh");

    const content = $("<div/>").addClass("cont");

    page.append(content);

    if (current) page.addClass("currenth");

    const buttons = $("<div/>").addClass("row").attr("id", "buttons");

    if (prev) {
        const p = $("<button/>").attr("id", "prev").text("< " + prev).on("click", function () {
            switchPage(prev);
        });
        buttons.append(p);
    }

    if (next) {
        const n = $("<button/>").attr("id", "next").text(next + " >").on("click", async function () {
            if (next === "Done") {
                if (mode == "event") {
                    const title = $("#title");
                    const desc = $("#desc");
                    const cate = $("#cate");
                    const date = $("#date");
                    const loc = $("#location");
                    const cost = $("#cost");
                    const preview = $("#preview");
                    const agenda = $("#agenda");

                    if (!loc.val()) loc.val("None");

                    const data = {
                        title: title.val(),
                        desc: desc.val(),
                        category: cate.val(),
                        date: date.val(),
                        location: Utils.toTitleCase(loc.val()),
                        cost: cost.val(),
                        agenda: agenda.val().replaceAll("\n", "<br>"),
                    };

                    if (!isPlaceholder) {
                        data.preview = preview.attr("src");
                    }

                    // upload
                    if (urlParams.get("e")) {
                        const e = new Event(urlParams.get("e"));
                        await e.update(data);

                        window.location.href = "../event/index.html?e=" + urlParams.get("e");
                    } else {
                        data.timestamp = Timestamp.fromDate(new Date());
                        data.creator = auth.currentUser.uid;
                        if (urlParams.get("u")) {
                            data.creator = urlParams.get("u");
                        }

                        const id = await Event.create(data);
                        Utils.logMetric("event_created");

                        window.location.href = "../event/index.html?e=" + id;
                    }
                }

                if (mode == "update") {
                    const title = $("#update-title");
                    const desc = $("#update-desc");

                    const data = {
                        title: title.val(),
                        desc: desc.val().replaceAll("\n", "<br>"),
                    }

                    if (urlParams.get("update")) {
                        const up = new Update(urlParams.get("update"))

                        await up.update(data)
                    }
                    else {

                        data.timestamp = Timestamp.fromDate(new Date());
                        data.creator = auth.currentUser.uid;
                        data.face = auth.currentUser.uid;

                        if (urlParams.get("u")) {
                            data.creator = urlParams.get("u");
                        }

                        await Update.create(data)
                    }

                    window.location.href = "../user/index.html?u=" + await new User(urlParams.get("u")).getUsername()
                }
            } else {
                switchPage(next);
            }
        });

        buttons.append(n);
    }

    page.append(buttons);

    modal.append(page);

    return page;
}

if (mode == "update") {
    const init = addPage("Details", null, "Done", true)

    addField(init, "Title:", (row) => {
        const input = $("<input/>").attr("id", "update-title").val("Example").attr("maxlength", "25");

        input.on("change", function () {
            if (input.val().length < 1) {
                input.val("Example");
            }
        });

        row.append(input);
    })

    addField(init, "Summary:", function (row) {
        row.css({ "place-items": "start", "flex-direction": "column" });

        const txtDiv = $("<div/>").css("width", "100%");

        const txtArea = $("<textarea/>").attr("rows", "5").val("A brief text 400 chars or less").attr("maxlength", "400").attr("id", "update-desc");

        txtArea
            .on("change", function () {
                if (txtArea.val().length < 10) {
                    txtArea.val("Your summary must be at least 10 characters");
                }
            });


        txtDiv.append(txtArea);
        row.append(txtDiv);
    });
}

if (mode == "event") {

    const init = addPage("Details", null, "Agenda", true);

    addField(init, "Title:", function (row) {
        const input = $("<input/>").attr("id", "title").val("Event Name").attr("maxlength", "25");

        input.on("change", function () {
            if (input.val().length < 1) {
                input.val("Event Name");
            }
        });

        row.append(input);
    });

    addField(init, "Summary:", function (row) {
        row.css({ "place-items": "start", "flex-direction": "column" });

        const txtDiv = $("<div/>").css("width", "100%");

        const txtArea = $("<textarea/>").attr("rows", "5").val("A summary for the event\n(displayed in the event preview)").attr("maxlength", "400").attr("id", "desc");

        const txtLimit = $("<h5/>").css("text-align", "right").css("color", "gray").html('<span id="count" style="color: gray">0</span>/400');

        txtArea.on("input", function () {
            txtLimit.find("span").text(txtArea.text().length);
        });

        txtLimit.find("span").text(txtArea.text().length);

        txtArea.on("change", function () {
            if (txtArea.val().length < 10) {
                txtArea.val("Your summary must be at least 10 characters");
            }
            txtLimit.find("span").text(txtArea.text().length);
        });

        txtDiv.append(txtArea);
        txtDiv.append(txtLimit);

        row.append(txtDiv);
    });

    addField(init, "Category:", function (row) {
        const cate = $("<select/>").attr("id", "cate");

        const favs = ["Club Activity", "Sports", "Tech"];

        let categories = ["Arts", "Community", "Club Activity", "Food & Drink", "Fitness", "Sports", "Music", "Workshops / Classes", "Family / Kids", "Tech", "Holidays", "Networking", "Activism", "Travel", "Conference", "Charity", "Community Service"];

        const fav = $("<optgroup/>").attr("label", "Favorites");

        favs.forEach(function (e) {
            categories = categories.filter(function (item) {
                return item !== e;
            });

            const opt = $("<option/>").text(e);
            fav.append(opt);
        });

        const $group = $("<optgroup/>").attr("label", "Other Categories");

        categories.sort();

        categories.forEach(function (element) {
            const opt = $("<option/>").text(element);
            $group.append(opt);
        });

        cate.append(fav).append($group);

        cate.on("change", function () {
            console.log(cate.val());
        });

        row.append(cate);
    });

    addField(init, "Date:", function (row) {
        const date = $("<input/>").attr("id", "date").val(new Date().toLocaleDateString("en-US"));

        date.on("change", function () {
            if (new Date(date.val()) < new Date() || new Date(date.val()) == "Invalid Date") {
                date.val(new Date().toLocaleDateString("en-US"));
            } else {
                date.val(new Date(date.val()).toLocaleDateString("en-US"));
            }
        });

        row.append(date);
    });

    addField(init, "Cost:", function (row) {
        const inp = $("<input/>").attr("id", "cost").attr("placeholder", "0").val("0").attr("type", "number");

        inp.on("change", function () {
            if (inp.val() < 0) inp.val(0);
            if (inp.val() > 1000) inp.val(1000);
        });

        row.append(inp);
    });

    const age = addPage("Agenda", "Details", "Image");

    function wrapText(textarea, startTag, endTag) {
        // assume textarea is jquery
        textarea = $(textarea)[0];

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        if (textarea.disabled) {
            return;
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
        row.css({ placeItems: "start", flexDirection: "column" });

        const txtDiv = $("<div/>").css({ width: "100%" });

        const buttons = $("<div/>", { class: "row buttons" })
            .css({
                marginLeft: "auto",
                placeContent: "end",
            })
            .css("display", "none")

        function addButton(name, func) {
            const button = $("<button/>").text(name).css({
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
                borderBottom: "none",
            });

            button.on("click", func);
            buttons.append(button);
        }

        const txtArea = $("<textarea/>", {
            id: "agenda",
            placeholder: `This is where you put a detailed run down of your plans for the event!`,
            maxLength: "1000",
        }).css({ width: "500px", height: "400px" });

        const txtP = $("<p/>", {
            class: "inp",
            css: {
                width: "500px",
                height: "400px",
                overflowY: "auto",
                display: "none",
                fontSize: "1em",
                borderTopRightRadius: "0",
                border: "3px solid var(--accent)",
            },
        });

        let showFinal = false;

        addButton("View Output", () => {
            if (!showFinal) {
                txtArea.hide().prop("disabled", true);
                txtP.show().html(txtArea.val().replaceAll("\n", "<br>"));
                showFinal = true;
            } else {
                txtArea.prop("disabled", false).show();
                txtP.hide();
                showFinal = false;
            }
        });

        addButton("Bold", () => {
            wrapText(txtArea[0], "<b>", "</b>");
        });
        addButton("Italic", () => {
            wrapText(txtArea[0], "<i>", "</i>");
        });
        addButton("Underline", () => {
            wrapText(txtArea[0], "<u>", "</u>");
        });

        const txtLimit = $("<h5/>").css({ textAlign: "right", color: "gray" });

        txtLimit.html('<span id="count" style="color: gray">0</span>/1000');

        txtArea.on("input", () => {
            txtLimit.find("span").text(txtArea[0].textLength);
        });

        txtArea.on("change", () => {
            if (txtArea[0].textLength < 1) {
                txtArea.val("This cannot be left blank!!");
            }
            txtLimit.find("span").text(txtArea[0].textLength);
        });

        txtDiv.append(buttons, txtArea, txtP, txtLimit);
        row.append(txtDiv);
    });

    const preview = $("<img/>", {
        id: "preview",
        src: "../img/placeholder.png",
    });

    const addImage = addPage("Image", "Agenda", "Location");

    addImage.find(".cont").append(preview);

    addField(addImage, "Image Upload:", (row) => {
        const input = $("<input/>", {
            type: "file",
            accept: "image/png, image/jpeg",
            name: "upload",
            id: "upload",
        }).on("change", async function () {
            const file = input[0].files[0];
            preview.attr("src", await Utils.getBase64(file));
            isPlaceholder = false;
        });

        const label = $("<label/>", {
            text: "Browse...",
            for: "upload",
        }).on("click", function () {
            input.click();
        });

        row.append(input, label);
    });

    const loc = addPage("Location", "Image", "Done");

    const map = $("<iframe/>", {
        id: "map",
        src: "https://www.google.com/maps/embed/v1/place?q=''&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8",
        style: "border: 0px solid black",
    })
        .css("width", "600px")
        .css("height", "350px")


    loc.find(".cont").append(map);

    addField(loc, "Address:", (row) => {
        const newRow = $("<div/>", { class: "row" }).css({
            flexWrap: "nowrap",
            height: "37.2px",
            gap: "0",
        });

        const input = $("<input/>", {
            id: "location",
            placeholder: "Location / Address",
        }).css({
            borderTopRightRadius: "0",
            borderBottomRightRadius: "0",
        });

        const search = $("<img/>", {
            src: "../img/icons/search.png",
            css: {
                width: "auto",
                height: "calc(100% - 10px)",
                padding: "10px",
                paddingTop: "5px",
                paddingBottom: "5px",
                border: "2px solid var(--dark0)",
                borderTopRightRadius: "15px",
                borderBottomRightRadius: "15px",
            },
            id: "searchButton",
            on: {
                click: function () {
                    map.attr("src", `https://www.google.com/maps/embed/v1/place?q=${input.val().replaceAll(" ", "+")}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`);
                },
            },
        });

        newRow.append(input, search);
        row.append(newRow);
    });
}

content.append(modal);

// load data if event id is present
if (urlParams.get("e") && mode == "event") {
    const e = new Event(urlParams.get("e"));
    const data = await e.get();

    const title = $("#title");
    const desc = $("#desc");
    const category = $("#cate");
    const date = $("#date");
    const cost = $("#cost");
    const agenda = $("#agenda");
    const location = $("#location");

    const currentUser = new User(auth.currentUser.uid);
    const badges = await currentUser.getBadges();

    const creator = new User(data.creator);
    const readOnlyMember = await creator.getMemberReadOnly(currentUser.uid);


    if (currentUser.uid === data.creator || badges.admin || readOnlyMember.admin) {
        title.val(data.title);
        desc.val(data.desc);
        category.val(data.category);
        date.val(data.date);
        cost.val(data.cost);
        agenda.val(data.agenda.replaceAll("<br>", "\n"));
        location.val(data.location);
        if (data.preview) {
            preview.attr("src", data.preview);
            isPlaceholder = false;
        }
    } else {
        console.error("idk");
    }
}

if (urlParams.get("update")) {
    const e = new Update(urlParams.get("update"));
    const data = await e.get();

    const title = $("#update-title");
    const desc = $("#update-desc");

    const currentUser = new User(auth.currentUser.uid);
    const badges = await currentUser.getBadges();

    const creator = new User(data.creator);
    const readOnlyMember = await creator.getMemberReadOnly(currentUser.uid);

    if (currentUser.uid === data.creator || badges.admin || readOnlyMember.admin) {
        title.val(data.title);
        desc.val(data.desc);
    } else {
        console.error("idk");
    }
}