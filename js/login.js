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

const usernameValidate = /^(?=.{5,30}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/



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
    await setDoc(doc(db, "usernames", user.uid), {
        username: username.toLowerCase()
    });

    await setDoc(doc(db, "users", user.uid, "data", "public"), {
        displayName: username,
        username: username.toLowerCase(),
        hostEvents: []
    })

    await setDoc(doc(db, "users", user.uid, "data", "private"), {
        rsvps: []
    })

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

        if (isNewUser) {
            console.log("New User")
            let tempUsername = generateUsername()

            await setUserData(user, tempUsername)

            
        }
        console.log(user)

        window.location.href = "../"

        
        // IdP data available using getAdditionalUserInfo(result)
        // ...
    })
}

// normal sign up
signUp.onclick = function() {
    console.log(usernameValidate.test(username.value))
    createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
        // Signed up 
        const user = userCredential.user;
        var finalUsername = generateUsername()
        if (usernameValidate.test(username.value) && !usernames.includes(username.value)) {
            finalUsername = username.value
        }
        
        await setUserData(user, finalUsername)

        window.location.href = "../"
        // ...
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
    });
}

// normal sign in
signIn.onclick = function() {
    signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        window.location.href = "../"

        // ...
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    });
}
