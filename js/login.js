import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, getAdditionalUserInfo } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { auth, google, db } from "./firebase.js";
import { setDoc, doc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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


const usernameValidate = /^(?=.{5,15}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/



// get exisitng usernames
const usernames = []

const q = query(collection(db, "usernames"));

const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    usernames.push(doc.data()["username"])
});


// random username

var a = ["Small", "Blue", "Pretty", "Big", "High", "Silly", "Red", "Party", "Cute", "Beautiful"];
var b = ["Bear", "Dog", "Banana", "Sheep", "Apple", "Cat", "Dog", "Possum", "Potato"];

function generateUsername() {
    var rA = Math.floor(Math.random()*a.length);
    var rB = Math.floor(Math.random()*b.length);
    var rC = Math.floor(Math.random() * 1000)
    while (usernames.includes(a[rA] + b[rB])) {
        rA = Math.floor(Math.random()*a.length);
        rB = Math.floor(Math.random()*b.length);
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


function nameChecks() {

    const value = username.value

    const name = "Username"

    if (value.length < 5) {
        return name + " must be atleast 5 chars long"
    }

    if (value.length > 15) {
        return name + " cannot be over 15 chars long"
    }

    if (value.startsWith("_") || value.endsWith("_")) {
        return name + " cannot have an _ at the start or end"
    }
    if (value.startsWith("-") || value.endsWith("-")) {
        return name + " cannot have a - at the start or end"
    }

    if (!value.match(/^[A-Za-x0-9._.-]+$/)) {
        return name + " can only contain Alphanumric chars\n Along with chars such as '_' or '-'"
    }


    return "Good"
}

function emailChecks() {
    if (!email.value.includes("@") || !email.value.includes(".")) {
        return "Email isnt valid"
    }
    return "Good"
}

function passwordChecks() {
    if (password.value.length < 6) {
        return "Password must have atleast 6 chars"
    }
    return "Good"
}

function redirect() {
    if (urlParams.get("r")) {
        window.location.href = urlParams.get("r")
    }
    else {
        window.location.href = "../"
    }
}

username.oninput = function() {
    if (nameChecks() != "Good") {
        usernameDiv.style.border = "2px solid var(--red)"
        usernameError.innerText = nameChecks()
    }
    else {
        usernameDiv.style.border = "none"
        usernameError.innerText = ""
        
    }
}

email.oninput = function() {
    if (emailChecks() != "Good") {
        email.style.border = "2px solid var(--red)"
        emailError.innerText = emailChecks()
    }
    else {
        email.style.border = "none"
        emailError.innerText = ""
        
    }
}

password.oninput = function() {
    if (passwordChecks() != "Good") {
        password.style.border = "2px solid var(--red)"
        passwordError.innerText = passwordChecks()
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
        const {isNewUser} = getAdditionalUserInfo(result)
        localStorage.clear()


        if (isNewUser) {
            console.log("New User")
            let tempUsername = generateUsername()

            await setUserData(user, tempUsername)

            
        }
        console.log(user)

        redirect()

        
        // IdP data available using getAdditionalUserInfo(result)
        // ...
    })
}

// normal sign up
signUp.onclick = function() {
    
    createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
        // Signed up 
        const user = userCredential.user;
        var finalUsername = generateUsername()
        if (username.value)

        if (!usernames.includes(username.value) && nameChecks()) {
            finalUsername = username.value
        }
        
        await setUserData(user, finalUsername)

        redirect()
        // ...
    })
}

// normal sign in
signIn.onclick = function() {
    signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
        localStorage.clear()

        // Signed in 
        const user = userCredential.user;
        redirect()

        // ...
    })
}
