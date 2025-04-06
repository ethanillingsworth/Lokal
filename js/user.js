import { getDoc, doc, query, collection, getDocs, where, limit, startAfter, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { listAll, deleteObject, ref } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

import { db, auth, imgDB } from "./firebase.js";
import {
    User,
    Badge,
    Event,
    MoreMenu,
    Update,
    CSS,
    ImageViewer,
    PostPopup,
    Media
} from "./funcs.js";


CSS.loadFiles(["../css/user.css"])


import "./jquery.js";


const params = new URLSearchParams(window.location.search);

if (params.has('u')) {
    const username = params.get('u');
    // Redirect to the new format /user/username
    window.location.replace(`/user/${username}`);
}

const path = window.location.pathname;

const pageUser = path.split('/').pop();

const content = $("#content");

// Modal
const modal = $("<div/>").addClass("modal");

// Top row
const top = $("<div/>")
    .addClass("row")
    .attr("id", "top")
    .css("width", "100%")
    .css("place-content", "start");

const pfp = $("<img/>")
    .attr("src", "../img/pfp.jpg")
    .attr("id", "pfp")
    .addClass("border");

// User Details
const userDetails = $("<div/>")
    .addClass("col")
    .attr("id", "userDetails")
    .css("gap", "20px");

// Name Div
const nameDiv = $("<div/>")
    .addClass("row")
    .css("place-content", "start")
    .css("place-items", "center")
    .css("gap", "5px");

const displayName = $("<h2/>")
    .text("Loading...")
    .attr("id", "displayName");

const usrname = $("<h3/>")
    .text("Loading...")
    .attr("id", "username");

nameDiv.append(displayName).append(usrname);

const badges = $("<div/>")
    .addClass("row")
    .css("flex-wrap", "nowrap")
    .css("place-content", "start");

const desc = $("<p/>").text("Loading...");

const join = $("<button/>")
    .text("Join")
    .css("width", "fit-content")
    .css("display", "none");

const tabs = $("<div/>")
    .addClass("row tabList")
    .css("gap", "10px")
    .css("margin-bottom", "10px")
    .css("margin-top", "10px")
    .css("position", "relative")

// Tab Creation Function
function createTab(name, current) {
    const tab = $("<button/>")
        .addClass("tab")
        .text(name);

    if (current) tab.addClass("current");

    tabs.append(tab);

    const pageContent = $("<div/>")
        .addClass("pageContent")
        .attr("id", name);

    if (current) pageContent.addClass("currentPage");

    tab.on("click", function () {
        $(".pageContent").removeClass("currentPage");
        $(".tab").removeClass("current");

        tab.addClass("current");
        $(`#${name}`).addClass("currentPage");
    });

    modal.append(pageContent);
}

const divider = $("<hr/>");

const tools = $("<div/>").addClass("row tools");

top.append(pfp);
userDetails.append(nameDiv).append(badges).append(desc).append(join);
top.append(userDetails);

modal.append(top).append(tools).append(tabs).append(divider);

content.append(modal);

const uid = await User.getUID(pageUser)
const user = new User(uid)

async function attending(uid) {
    const attendingTab = $("#Attending")

    const q = query(collection(db, "posts"))

    const get = await getDocs(q)

    get.forEach(async (event) => {

        const uData = await getDoc(doc(db, "posts", event.id, "uData", uid))

        const e = new Event(event.id)

        if (uData.exists()) {
            const data = uData.data()
            // check if user is attending
            if (data.attending) {
                await e.display(attendingTab)
            }
        }
    })
}

async function members(user) {
    const tab = $("#Members")

    const q = query(collection(db, "users", user.uid, "members"), where("joined", "==", true), limit(25))

    const get = await getDocs(q)

    function refreshUsers() {
        tab.empty()

        get.forEach(async (person) => {
            const personClass = new User(person.id)

            let readOnly = await user.getMemberReadOnly(person.id)

            let currentUserReadOnly = {}

            if (auth.currentUser) currentUserReadOnly = await user.getMemberReadOnly(auth.currentUser.uid)

            if (readOnly.accepted == false) return

            const username = await personClass.getUsername()
            const pub = await personClass.getData("public")
            const meta = await personClass.getData("hidden")


            let admin = false

            if (readOnly.admin) { admin = true }

            const dis = await User.display(username, pub, meta, tab, admin)

            let currentUser = new User("notloggedin")

            if (auth.currentUser) currentUser = new User(auth.currentUser.uid)

            const currentUserBadges = await currentUser.getBadges()


            if (currentUserBadges.includes('admin') || currentUserReadOnly.admin) {

                const actions = dis.find(".actions");
                actions.empty();


                let p = !admin;

                const moreMenu = new MoreMenu()

                moreMenu.more.addClass("action")

                const prodemote = moreMenu.add(admin ? "Demote" : "Promote")

                prodemote.on("click", async () => {
                    if (p) {
                        if (confirm("Are you sure you want to promote that person?")) {
                            await user.updateMemberReadOnly(person.id, { admin: true });
                            p = false;
                            prodemote.text("Demote")

                        }

                    } else {
                        if (confirm("Are you sure you want to demote that person?")) {
                            await user.updateMemberReadOnly(person.id, { admin: false });
                            p = true;
                            prodemote.text("Promote")
                        }
                    }
                    refreshUsers()
                })

                moreMenu.add("Remove", async () => {
                    if (confirm("Are you sure you want to remove that person from your group?")) {
                        await user.updateMember(person.id, { pending: false, joined: false });
                        await user.updateMemberReadOnly(person.id, { false: true })
                        actions.parent().remove();
                    }
                })

                const open = $("<img/>")
                    .addClass("action")
                    .attr("src", "../img/icons/right.png")
                    .on("click", function () {
                        window.location.href = `../user/index.html?u=${username}`;
                    });

                if (auth.currentUser.uid !== personClass.uid) {
                    actions.append(moreMenu.more);
                }

                actions.append(open);
            }
        })
    }

    refreshUsers()
}

// fetch new names everytime
const nameExists = async (value) => {
    const g = await user.getGallery()
    g.some((folder) => folder.name === value)
};

async function groups(user) {
    const tab = $("#Groups")

    const groupQ = query(collection(db, "users"), where("badges", "array-contains", "group"))

    const groups = await getDocs(groupQ)

    groups.forEach(async (g) => {
        const group = new User(g.id)

        const username = await group.getUsername()

        const pub = await group.getData("public")
        const meta = await group.getData("hidden")
        const mem = await group.getMember(user.uid)


        if (mem.joined) {
            await User.display(username, pub, meta, tab)
        }
    })

}

async function requests(user) {
    const tab = $("#Requests")

    const q = query(collection(db, "users", user.uid, "members"), where("pending", "==", true), limit(25))

    const get = await getDocs(q)



    get.forEach(async (person) => {
        const personClass = new User(person.id)

        const username = await personClass.getUsername()
        const pub = await personClass.getData("public")
        const meta = await personClass.getData("hidden")


        const dis = await User.display(username, pub, meta, tab)

        const actions = dis.find(".actions");
        actions.empty();

        const reject = $("<img/>")
            .addClass("action")
            .attr("src", "../img/icons/x.png")
            .on("click", async function () {
                await user.updateMember(person.id, { pending: false, joined: false });
                if (pub.notifs) {
                    await user.notifyMember(personClass.uid, "has rejected you from their group...", "View their page on Lokal below", `https://lokalevents.com/user/index.html?u=${await user.getUsername()}`)
                }
                actions.parent().remove();
            });

        const confirm = $("<img/>")
            .addClass("action")
            .attr("src", "../img/icons/confirm.png")
            .on("click", async function () {
                await user.updateMember(person.id, { pending: false, joined: true });
                await user.updateMemberReadOnly(person.id, { accepted: true })
                if (pub.notifs) {
                    await user.notifyMember(personClass.uid, "has accepted you into their group!", "View their page on Lokal below", `https://lokalevents.com/user/index.html?u=${await user.getUsername()}`)
                }
                actions.parent().remove();
            });

        actions.append(reject);
        actions.append(confirm);
    })
}

async function gallery(user) {
    const tab = $("#Gallery")
    tab.html("")

    const g = await user.getGallery();

    const none = $("<h2/>").text("Nothing to see here...").css("font-size", "1.5em").attr("id", "none")

    tab.append(none)

    if (g.length > 0) {
        none.css("display", "none")
    }

    g.forEach(async (folder) => {
        const head = $("<div/>").addClass("row").css("place-content", "start").css("place-items", "center").addClass("head")

        const l = $("<h2/>").text(folder.name).css("font-size", "1.75em")
        let removeMode = false

        head.append(l)
        const tools = $("<div/>").addClass("tools").css("width", "100%")

        const more = new MoreMenu()

        const scroll = $("<div/>").addClass("row scroll")

        let imgs = []

        async function refreshImages() {
            scroll.html("")
            imgs = []

            const images = await user.bucket.getAllImages(folder)

            for (let index = 0; index < images.length; index++) {
                const image = images[index];

                const url = await user.bucket.getImage("gallery/" + folder.name + "/" + image.name)

                imgs.push({ url: url, name: image.name })
                const i = $("<img/>")
                    .addClass("image")
                    .attr("src", url)
                    .attr("data_path", "gallery/" + folder.name + "/" + image.name)

                i[0].onclick = () => {
                    new ImageViewer(imgs, index)
                }

                scroll.append(i)
            }
        }

        more.add("Upload Images", async () => {
            const inp = $("<input/>")
                .attr("type", "file")
                .attr("multiple", true)
                .css("z-index", "-10000")
                .css("position", "absolute")
            $(document.body).append(inp)

            inp.on("change", async () => {
                for (let index = 0; index < inp[0].files.length; index++) {
                    const file = inp[0].files[index];

                    await user.bucket.uploadImage(file, `gallery/${folder.name}/${file.name}`);

                }
                window.location.reload()

            });

            inp.trigger("click")




        })

        more.add("Remove Images", async () => {
            if (!removeMode) {
                removeMode = true
                scroll.addClass("remove")
                for (let index = 0; index < scroll.children().length; index++) {
                    const element = $(scroll.children()[index]);

                    element[0].onclick = async () => {
                        await user.bucket.removeImage(element.attr("data_path"))
                        element.remove()
                        if (scroll.children().length < 1) {
                            head.remove()
                        }
                    }
                }
            }
            else {
                removeMode = false
                scroll.removeClass("remove")
                for (let index = 0; index < scroll.children().length; index++) {
                    const element = $(scroll.children()[index]);

                    element[0].onclick = async () => {
                        new ImageViewer(imgs, index)
                    }
                }
            }
        })

        more.add("Edit Name", async () => {
            const name = prompt("Enter new folder name:")

            if (name.length < 1 || name.length > 30) {
                alert("Name cannot be blank, and cannot be over 30 chars.")
                return
            }
            else if (await nameExists(name)) {
                alert("You already have a folder with this name.")
                return
            }
            console.log(folder.name)
            console.log(name)


            await user.bucket.moveImages(`gallery/${folder.name}`, `gallery/${name}`)
            await user.bucket.removeImagesFromPath(`gallery/${folder.name}`)

            l.text(name)

        })

        more.add("Remove Folder", async () => {
            if (confirm("Are you sure you want to delete this folder?") && confirm("This will delete all of the images in the folder.")) {
                listAll(folder)
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

                head.remove()
                scroll.remove()

            }
        })

        tab.append(head)
        more.more.css("margin-left", "auto")
        more.more.css("width", "fit-content")
        tools.append(more.more)
        head.append(tools)
        tab.append(scroll)

        // for (let index = 0; index < 100; index++) {
        //     scroll.append($("<img/>").addClass("image").attr("src", `https://picsum.photos/${Math.floor(Math.random() * (1500 - 500) + 500)}/${Math.floor(Math.random() * (1000 - 500) + 500)}`))
        // }
        await refreshImages()

    })
}

// const calendar = new Calendar()

// async function cal(user) {
//     const tab = $("#Calendar")

//     const q = query(collection(db, "posts"), where("creator", "==", user.uid))

//     const get = await getDocs(q)

//     get.forEach((post) => {
//         const d = post.data()

//         const splitDate = d.date.split("/")
//         calendar.addEvent(splitDate[2], splitDate[0], splitDate[1], post.id)
//     })

//     calendar.display(tab)
// }



function updateProfile(data, pfp) {
    $("#username").text(`(@${pageUser})`);
    document.title = `Lokal - @${pageUser}`;
    displayName.text(data.displayName);

    desc.html(data.desc.replaceAll("\n", "<br>"));

    $("#pfp").attr("src", pfp);


    if (data.accentColor) {
        $("#pfp").css("border-color", data.accentColor);
    }

}


const pub = await user.getData("public")

let bds = await user.getBadges()

console.log(bds)

bds.forEach((badgeName) => {
    const badge = Badge.getFromName(badgeName)

    badges.append(badge)
})

// get actual data
const data = await user.getData("public")
const profilePicture = await user.getPfp()


async function feed(uid) {
    const feedTab = $("#Feed")

    const none = $("<h2/>").text("There seems to be no posts...").css("font-size", "1.5em")
    feedTab.append(none)

    if (data.pinned) {
        let up = null
        if (data.pinned.type == "EVENT") {
            up = new Event(data.pinned.id)
        }
        if (data.pinned.type == "UPDATE") {
            up = new Update(data.pinned.id)
        }

        if (data.pinned.type == "Media") {
            up = new Media(data.pinned.id)
        }

        await up.display(feedTab, true)

    }

    let pinned = {}

    if (data.pinned) {
        pinned = data.pinned
    }

    let lastDoc = null;

    async function loadDocs(posts) {
        lastDoc = posts.empty ? null : posts.docs[posts.docs.length - 1]
        for (const post of posts.docs) {
            if (post.id !== pinned.id) {
                let u = null;
                const data = post.data()

                if (data.type == "EVENT") {
                    u = new Event(post.id)
                }

                if (data.type == "UPDATE") {
                    u = new Update(post.id)
                }

                if (data.type == "MEDIA") {
                    u = new Media(post.id)
                }
                none.remove();
                await u.display(feedTab);
            }
        }
    }

    const posts = await getDocs(query(
        collection(db, "posts"),
        where("creator", "==", uid),
        orderBy("timestamp", "desc"),
        limit(25)
    ))

    await loadDocs(posts)

    const loadMore = $("<h3/>")
        .text("Load More...")
        .addClass("loadMore")
        .on("click", async () => {
            loadMore.remove()
            if (!lastDoc) return; // Prevent querying if no more documents

            const q = await getDocs(query(
                collection(db, "posts"),
                where("creator", "==", uid),
                orderBy("timestamp", "desc"),
                startAfter(lastDoc), // Start from the last loaded document
                limit(25)
            ));

            await loadDocs(q)
            if (q.docs.length == 25) {
                feedTab.append(loadMore)
            }

        })


    if (posts.docs.length == 25) {
        feedTab.append(loadMore)
    }

}

onAuthStateChanged(auth, async (u) => {

    // if not logged in, do nothing
    if (!u) {
        return
    }

    updateProfile(data, profilePicture)

    const currentUser = new User(u.uid)

    let bdsU = await currentUser.getBadges()

    const readOnly = await user.getMemberReadOnly(currentUser.uid)

    if (bds.includes("group")) {
        createTab("Feed", true)
        createTab("Members")

    }

    else {
        createTab("Attending", true)
        createTab("Groups")

    }

    if ((u.uid == uid || bdsU.includes("admin")) || (bds.includes("group") && readOnly.admin)) {


        const moreMenu = new MoreMenu()

        if (bds.includes("group")) {
            moreMenu.add("Add Post", () => {
                const popup = new PostPopup(uid)

                popup.show()
            })

        }
        else {
            if (pub.notifs) {
                moreMenu.add("Turn Off Notifications", async () => {
                    await user.updateData({ notifs: false }, "public")
                    alert("We've updated your notification preferences")
                    location.reload()
                })
            }
            else {
                moreMenu.add("Turn On Notifications", async () => {
                    await user.updateData({ notifs: true }, "public")
                    alert("We've updated your notification preferences")
                    location.reload()
                })
            }
        }

        moreMenu.add("Edit Profile", () => {
            window.location.href = "../edit/index.html?u=" + urlParams.get("u")
        })

        if (bds.includes("group")) {
            moreMenu.add("Delete Profile", async () => {
                await user.delete()

                const priv = await currentUser.getData("private")
                await currentUser.updateData({
                    groupsCreated: priv.groupsCreated - 1
                }, "private")

                window.location.href = "../"

            })
        }




        tools.append(moreMenu.more)
    }

    if (bds.includes("group")) {
        await feed(uid)
        await members(user)
        // await gallery(user)

    }

    else {
        await attending(uid)

        await groups(user)

    }

    if (readOnly.admin || bds.includes("group") && bdsU.includes("admin")) {
        createTab("Requests")
        await requests(user)
    }


    if (bds.includes("group")) {
        const memberData = await user.getMember(currentUser.uid)



        if (memberData.pending) {
            join.addClass("pending")
            join.text("Pending...")
        }

        if (readOnly.accepted && memberData.joined) {

            join.text("Joined")
        }

        if (!readOnly.admin) {
            join.css("display", "flex")
        }

        join.on("click", async function () {
            if (join.text() == "Join") {
                join.addClass("pending")
                join.text("Pending...")
                await user.updateMember(currentUser.uid, { pending: true })

            }
            else if (join.text() == "Pending...") {
                join.removeClass("pending")
                join.text("Join")

                await user.updateMember(currentUser.uid, { pending: false })
            }
            else if (join.text() == "Joined") {

                join.text("Join")
                await user.updateMember(currentUser.uid, { pending: false, joined: false })

            }
        })

    }
})

