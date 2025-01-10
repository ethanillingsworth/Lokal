import { getDocs, query, collection, limit, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { User } from "./funcs.js";
import { db } from "./firebase.js";

const groups = await getDocs(query(collection(db, "users"), where("badges", "array-contains", "group"), limit(100)))

groups.forEach(async g => {
    const u = new User(g.id)
    const username = await u.getUsername()
    const pub = await u.getData("public")
    const hidden = await u.getData("hidden")

    await User.display(username, pub, hidden)

});