import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, getAdditionalUserInfo } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { auth, google, db } from "./firebase.js";
import { setDoc, doc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { Validation } from "./funcs.js";

// elements
const googleButton = document.getElementById("google")
const signUp = document.getElementById("signup")
const signIn = document.getElementById("signin")

const email = document.getElementById("email")
const username = document.getElementById("username")
const password = document.getElementById("password")

const usernameDiv = document.getElementById("usernameDiv")
const usernameError = document.getElementById("usernameError")
const emailError = document.getElementById("emailError")
const passwordError = document.getElementById("passwordError")


const urlParams = new URLSearchParams(window.location.search)


// random username

var a = ["Small", "Blue", "Pretty", "Big", "High", "Silly", "Red", "Party", "Cute", "Beautiful"];
var b = ["Bear", "Dog", "Banana", "Sheep", "Apple", "Cat", "Dog", "Possum", "Potato"];

function generateUsername() {
    var rA = Math.floor(Math.random() * a.length);
    var rB = Math.floor(Math.random() * b.length);
    var rC = Math.floor(Math.random() * 1000)
    while (usernames.includes(a[rA] + b[rB])) {
        rA = Math.floor(Math.random() * a.length);
        rB = Math.floor(Math.random() * b.length);
        rC = Math.floor(Math.random() * 1000)

    }
    return (a[rA] + b[rB] + rC)
}

async function setUserData(user, username) {
    localStorage.clear()
    await setDoc(doc(db, "usernames", user.uid), {
        username: username.toLowerCase()
    });

    await setDoc(doc(db, "uids", username.toLowerCase()), {
        userId: user.uid
    })

    await setDoc(doc(db, "users", user.uid, "data", "public"), {
        displayName: username,
        desc: "Set a description"
    })

    await setDoc(doc(db, "users", user.uid, "data", "private"), {
        prevRes: []
    })

}

function redirect() {
    if (urlParams.get("r")) {
        window.location.href = urlParams.get("r")
    }
    else {
        window.location.href = "../"
    }
}

username.oninput = function () {
    if (Validation.username(username.value) != true) {
        usernameDiv.style.border = "2px solid var(--red)"
        usernameError.innerText = Validation.username(username.value)
    }
    else {
        usernameDiv.style.border = "none"
        usernameError.innerText = ""

    }
}

email.oninput = function () {
    if (Validation.email(email.value) != true) {
        email.style.border = "2px solid var(--red)"
        emailError.innerText = Validation.email(email.value)
    }
    else {
        email.style.border = "none"
        emailError.innerText = ""

    }
}

password.oninput = function () {
    if (Validation.password(password.value) != true) {
        password.style.border = "2px solid var(--red)"
        passwordError.innerText = Validation.password(password.value)
    }
    else {
        password.style.border = "none"
        passwordError.innerText = ""

    }
}

// google sign in
googleButton.onclick = function () {

    signInWithPopup(auth, google)
        .then(async (result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            const { isNewUser } = getAdditionalUserInfo(result)
            localStorage.clear()

            const email = user.email


            if (isNewUser) {
                console.log("New User")

                let tempUsername = generateUsername()

                if (Validation.username(email.split("@")[0])) {
                    tempUsername = email.split("@")[0]
                }

                if (!await Validation.finalUsername(tempUsername)) {
                    tempUsername = generateUsername()

                }

                await setUserData(user, tempUsername)



            }
            console.log(user)

            redirect()


            // IdP data available using getAdditionalUserInfo(result)
            // ...
        })
}

// normal sign up
signUp.onclick = async function () {

    if (await Validation.finalUsername(username.value) !== true) {
        alert(await Validation.finalUsername(username.value))
        return
    }

    createUserWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            // Signed up 
            const user = userCredential.user;
            var finalUsername = generateUsername()

            // Username validation is screwed
            if (username.value) {

                if (Validation.username(username.value) === true) {
                    finalUsername = username.value

                }

                await setUserData(user, finalUsername)

                redirect()
                // ...
            }
        })
}

// normal sign in
signIn.onclick = function () {
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then((userCredential) => {
            localStorage.clear()

            // Signed in 
            const user = userCredential.user;
            redirect()

            // ...
        })
}
