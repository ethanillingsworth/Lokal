// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";

import { GoogleAuthProvider, getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED, enableNetwork, disableNetwork } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

    apiKey: "AIzaSyBLuDaj-mQb4vmYPQFZGBZzxmT90YSJLqE",

    authDomain: "lokal-fb.firebaseapp.com",

    projectId: "lokal-fb",

    storageBucket: "lokal-fb.appspot.com",

    messagingSenderId: "1030066574762",

    appId: "1:1030066574762:web:faa373483c65d1312d07d3",

    measurementId: "G-C36QNWS499"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);


export const google = new GoogleAuthProvider();
