import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { auth, db } from "./firebase.js";
import { setDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { Validation } from "./funcs.js";
import "./jquery.js";


// elements
// const googleButton = document.getElementById("google")
const signUp = $("#signup")
const signIn = $("#signin")

const email = $("#email")
const username = $("#username")
const password = $("#password")

const usernameDiv = $("#usernameDiv")
const usernameError = $("#usernameError")
const emailError = $("#emailError")
const passwordError = $("#passwordError")


const forgotPass = $("#forgotpass")

forgotPass.on("click", () => {
    sendPasswordResetEmail(auth, email.val())
        .then(() => {
            alert("Password change request sent, check " + email.val() + "'s inbox!")
        })
        .catch((error) => {
            alert("Dont forget to fill out your email first!")
        })
})


const urlParams = new URLSearchParams(window.location.search)


// random username

var a = ["Small", "Blue", "Pretty", "Big", "Silly", "Red", "Party", "Cute", "Beautiful"];
var b = ["Bear", "Dog", "Banana", "Sheep", "Apple", "Cat", "Dog", "Possum", "Potato"];

function generateUsername() {
    var rA = Math.floor(Math.random() * a.length);
    var rB = Math.floor(Math.random() * b.length);
    var rC = Math.floor(Math.random() * 1000)

    return (a[rA] + b[rB] + rC)
}

async function setUserData(user, email, username) {

    await setDoc(doc(db, "usernames", user.uid), {
        username: username.toLowerCase()
    });

    await setDoc(doc(db, "uids", username.toLowerCase()), {
        userId: user.uid
    })

    await setDoc(doc(db, "users", user.uid, "data", "public"), {
        displayName: username,
        desc: "Set a description",
        timestamp: Timestamp.now()
    })

    await setDoc(doc(db, "users", user.uid, "data", "private"), {
        prevRes: [],
        groupsCreated: 0
    })
    // require manual approval for now

    // if (email.endsWith("@d214.org")) {
    //     await setDoc(doc(db, "users", user.uid), {
    //         approved: true
    //     })
    // }

}

function redirect() {
    if (urlParams.get("r")) {
        window.location.href = urlParams.get("r")
    }
    else {
        window.location.href = "../"
    }
}

username.on("input", () => {
    if (Validation.username(username.val()) != true) {
        usernameDiv.css("border", "2px solid var(--red)")
        usernameError.text(Validation.username(username.val()))

    }
    else {
        usernameDiv.css("border", "none")
        usernameError.text("")

    }
})

email.on("input", () => {
    if (Validation.email(email.val()) != true) {
        email.css("border", "2px solid var(--red)")
        emailError.text(Validation.email(email.val()))
    }
    else {
        email.css("border", "none")
        emailError.text("")

    }
})

password.on("input", () => {
    if (Validation.password(password.val()) != true) {
        password.css("border", "2px solid var(--red)")
        passwordError.text(Validation.password(password.val()))
    }
    else {
        password.css("border", "none")
        passwordError.text("")

    }
})


// google sign in
// googleButton.onclick = function () {

//     signInWithPopup(auth, google)
//         .then(async (result) => {
//             // This gives you a Google Access Token. You can use it to access the Google API.
//             const credential = GoogleAuthProvider.credentialFromResult(result);
//             const token = credential.accessToken;
//             // The signed-in user info.
//             const u = result.user;
//             const { isNewUser } = getAdditionalUserInfo(result)


//             const email = u.email




//             if (isNewUser) {


//                 let tempUsername = generateUsername()

//                 if (Validation.username(email.split("@")[0])) {
//                     tempUsername = email.split("@")[0]
//                 }

//                 if (!await Validation.finalUsername(tempUsername)) {
//                     tempUsername = generateUsername()

//                 }

//                 await setUserData(u, email, tempUsername)


//             }
//             redirect()


//             // IdP data available using getAdditionalUserInfo(result)
//             // ...
//         })
// }

// normal sign up
signUp.on("click", async () => {

    if (await Validation.finalUsername(username.val()) !== true) {
        alert(await Validation.finalUsername(username.val()))
        return
    }

    if (!email.val().endsWith("@stu.d214.org") && !email.val().endsWith("@d214.org")) {
        alert("That email isnt an authorized @stu.d214.org or @d214.org email adress.")
        return

    }

    createUserWithEmailAndPassword(auth, email.val(), password.val())
        .then(async (userCredential) => {
            // Signed up 
            const user = userCredential.user;
            var finalUsername = generateUsername()

            // Username validation is screwed
            if (username.val()) {

                if (Validation.username(username.val()) === true) {
                    finalUsername = username.val()

                }



                await setUserData(user, email.val(), finalUsername)

                redirect()
                // ...
            }
        })
})

// normal sign in
signIn.on("click", () => {
    signInWithEmailAndPassword(auth, email.val(), password.val())
        .then((userCredential) => {
            localStorage.clear()

            // Signed in 
            const user = userCredential.user;
            redirect()

            // ...
        })
        .catch((error) => {
            alert(error)
        })
})
