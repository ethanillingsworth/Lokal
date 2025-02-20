import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { CSS } from "./funcs.js";
import "./jquery.js";
CSS.loadFiles(["../css/edit.css"])



import { User, Validation, Utils } from "./funcs.js";

const content = $("#content")

const modal = $("<div></div>").addClass("modal")

const urlParams = new URLSearchParams(window.location.search);

function addField(head, action) {
    const row = $("<div></div>").addClass("row").css("placeContent", "start")

    const heading = $("<h3></h3>").text(head)

    row.append(heading)

    action(row)

    modal.append(row)
}

const buttons = $("<div></div>").addClass("row")

function addButton(label, onclick) {
    const button = $("<button></button>").text(label)

    buttons.append(button)

    button.on("click", () => {
        onclick()
    })
}

let pageUser = undefined

if (urlParams.get("u")) {

    pageUser = new User(await User.getUID(urlParams.get("u")))
}
let authUser = undefined

onAuthStateChanged(auth, async (user) => {
    authUser = new User(user.uid)
    const badges = await authUser.getBadges()



    if (urlParams.get("createGroup") && urlParams.get("u")) {
        window.location.href = "../"
        return
    }

    if (urlParams.get("createGroup")) {
        return
    }
    const readOnlyMember = await pageUser.getMemberReadOnly(authUser.uid)

    // allow if normal user account, they are a site admin, or group admin
    if (user.uid == pageUser.uid || badges.includes("admin") || readOnlyMember.admin) {

    }
    else {
        window.location.href = "../"

        return
    }


})



addField("Username:", async (row) => {

    const inp = $("<input></input>").attr("id", "username").attr("placeholder", "lokal")
    row.append(inp)
})

addField("Display Name:", (row) => {
    const inp = $("<input></input>").attr("id", "displayName").attr("placeholder", "Lokal")

    row.append(inp)
})
let bdgs = undefined
if (pageUser) {
    bdgs = await pageUser.getBadges()

    if (bdgs.includes("group")) {

        addField("Contact Email:", (row) => {
            const inp = $("<input></input>").attr("id", "email").attr("placeholder", "support@lokalevents.com")

            row.append(inp)
        })
    }
}

addField("Description:", (row) => {
    row.css("placeItems", "start")
    row.css("flexDirection", "column")

    const inp = $("<textarea></textarea>")
        .attr("placeholder", "You should probably change this.")
        .attr("rows", 5)
        .attr("id", "desc")
        .attr("maxLength", 200)

    row.append(inp)

})

const preview = $("<img>").attr("id", "pfp").addClass("border").attr("src", "../img/pfp.jpg")

modal.append(preview)

let file = null

addField("Upload:", (row) => {

    row.css("placeContent", "center")

    const inp = $("<input>").attr("type", "file").attr("name", "fileUpload")
        .attr("accept", "image/png, image/jpeg")

    const lab = $("<label></label>").text("Select Image").attr("for", "fileUpload")

    lab.on("click", () => {
        inp.trigger("click")
    })

    inp.on("change", async (event) => {

        if (event.target.files[0].size > 2000000) {
            alert("That image is over 2 megabyte, please upload one under that size!")
            return
        }


        file = event.target.files[0]

        preview.attr("src", await Utils.getBase64(file))

    })

    row.append(lab)
    row.append(inp)
})

addField("Border Color:", (row) => {
    const inp = $("<input></input>")
        .attr("type", "color")
        .attr("id", "borderColor")
        .attr("value", "#a353b9")

    inp.on("change", () => {
        preview.css("borderColor", inp.val())
    })


    row.append(inp)
})

addButton("Cancel", () => {
    if (urlParams.get("createGroup")) {
        window.location.href = "../"
        return
    }
    window.location.href = "../user/index.html?u=" + oldUsername
})



modal.append(buttons)

content.append(modal)

let oldUsername = ""
let u = undefined

if (urlParams.get("u")) {

    const uid = await User.getUID(urlParams.get("u"))

    u = new User(uid)

    const badges = await u.getBadges()
    const authBadges = await authUser.getBadges()
    const pfp = await u.getPfp()

    if (!badges.includes("group") && !authBadges.includes("admin")) {
        $("#username").attr("disabled", true)
    }

    const pub = await u.getData("public")
    oldUsername = await u.getUsername()

    $("#username").val(oldUsername)

    $("#displayName").val(pub.displayName)

    $("#desc").val(pub.desc)
    if (pub.contactEmail) {
        $("#email").val(pub.contactEmail)
    }


    preview.attr("src", pfp)


    if (pub.accentColor) {
        preview.css("borderColor", pub.accentColor)

        $("#borderColor").val(Utils.rgbToHex(pub.accentColor))
    }
}

addButton("Done", async () => {
    const usernameVal = $("#username").val()
    const displayNameVal = $("#displayName").val()
    const descVal = $("#desc").val()

    const data = {

        displayName: displayNameVal,
        desc: descVal,
        accentColor: preview.css("borderColor")

    }

    data["contactEmail"] = $("#email").val()

    if (!data["contactEmail"]) {
        data["contactEmail"] = null
    }

    if (bdgs.includes("group")) {
        if (data["contactEmail"] == null) {
            alert("As a group you are required to have a contact email!")
            return
        }
        if (Validation.email(data["contactEmail"]) != true) {
            alert(Validation.email(data["contactEmail"]))
            return
        }
    }


    if (Validation.username(usernameVal) != true) {
        alert(Validation.username(usernameVal))
        return
    }


    if (usernameVal != oldUsername && await Validation.finalUsername(usernameVal) != true) {
        alert(await Validation.finalUsername(usernameVal))
        return
    }

    if (Validation.displayName(displayNameVal) != true) {
        alert(Validation.displayName(displayNameVal))
        return
    }

    if (urlParams.get("createGroup")) {


        const priv = await authUser.getData("private")

        if (priv.groupsCreated + 1 > 3) {
            alert("You already have 3 groups created, you'll have to delete one to make anymore.")
            window.location.href = "../index.html"
            return
        }

        const newUser = await User.createUser(usernameVal, data, {}, { badges: ["group"] })
        await newUser.updateMember(auth.currentUser.uid, { joined: true })

        await newUser.updateMemberReadOnly(auth.currentUser.uid, { admin: true, accepted: true })

        if (file != null) {
            await newUser.setPfp(file)
        }

        await authUser.updateData({
            groupsCreated: priv.groupsCreated + 1
        }, "private")
    }
    else {

        await u.updateUsername(usernameVal)

        if (file != null) {
            await u.setPfp(file)
        }

        await u.updateData(data, "public")
    }
    window.location.href = "../user/index.html?u=" + usernameVal
})