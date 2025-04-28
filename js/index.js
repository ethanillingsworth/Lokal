import { db } from "./firebase.js";
import "./jquery.js"

import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


$("#form").on("submit", async (event) => {
    event.preventDefault(); // Prevents the default form submission behavior

    const name = $("#full-name").val();
    const school = $("#school-name").val();
    const district = $("#school-district").val();
    const role = $("#role-title").val();
    const email = $("#school-email").val();
    const phone = $("#phone-number").val() || null;
    const contactMethod = $("#preferred-contact").val();
    const usage = $("#usage").val();
    const timeline = $("#timeline").val();

    const data = {
        name: name,
        school: school,
        district: district,
        role: role,
        email: email,
        phone: phone,
        contactMethod: contactMethod,
        usage: usage,
        timeline: timeline
    };

    try {
        await addDoc(collection(db, "demo-requests"), data);
        alert("Form submitted! We will try to reach out to you based on your timeline.");
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("There was an error submitting the form. Please try again.");
    }
    window.location.reload()
});