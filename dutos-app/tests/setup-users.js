
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8kU9fvYU9sfl80Se0k_AffEsgLVpxpAg",
    authDomain: "dutos-agency-os-2026.firebaseapp.com",
    projectId: "dutos-agency-os-2026",
    storageBucket: "dutos-agency-os-2026.firebasestorage.app",
    messagingSenderId: "132404399654",
    appId: "1:132404399654:web:817b8b8cc1e52d4409e0e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test Users Configuration
const users = [
    { email: "manager_qa@dutos.com", password: "password123", role: "manager", name: "Manager QA" },
    { email: "creative_qa@dutos.com", password: "password123", role: "creative", name: "Creative QA" },
    { email: "prod_qa@dutos.com", password: "password123", role: "production", name: "Production QA" },
    { email: "client_qa@dutos.com", password: "password123", role: "client", name: "Client QA", assigned_client_id: "client-id-placeholder" }
];

async function setupUsers() {
    console.log("🤖 Setting up Test Users...");

    // We need to create users. Since strict Allow Create rules might be in place,
    // the best way in a client-side script context without Admin SDK is to:
    // 1. Try to login.
    // 2. If fail, sign up (if allowed) or report "Manual Creation Needed".
    // Note: Standard Firebase Auth allows sign up if "Email/Password" provider is enabled and "Open Registration" is on.
    // DUTOS rules for /users collection usually require Admin to write role.

    // Strategy:
    // 1. Login as Admin
    // 2. We can't use `createUserWithEmailAndPassword` while logged in as Admin because it changes the current auth state to the new user.
    //    So we must:
    //    a) Create Auth User (Sign up) -> This logs us in as new user.
    //    b) Write to Firestore (This might fail if rules require Admin specific role, but usually 'create own profile' is a common pattern or we need to leverage the Admin allowing write).

    // Actually, `userStore.ts` showed us that creating a user involves a secondary app instance or just simple flow.
    // For this script, we'll try to just check if they exist by logging in.

    for (const u of users) {
        try {
            console.log(`👉 Checking ${u.role}: ${u.email}...`);
            await signInWithEmailAndPassword(auth, u.email, u.password);
            console.log(`   ✅ Login Successful. User exists.`);

            // Check Firestore Role
            const uid = auth.currentUser.uid;
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
                const data = snap.data();
                if (data.role === u.role) {
                    console.log(`   ✅ Firestore Role Verified: ${data.role}`);
                } else {
                    console.warn(`   ⚠️ Role Mismatch! Expected ${u.role}, got ${data.role}`);
                }
            } else {
                console.warn(`   ⚠️ Firestore Document Missing for ${u.email}`);
                // Try to fix if we are logged in as them (and have permission)
                // But usually only Admin can set roles.
            }
            await signOut(auth);

        } catch (e) {
            console.error(`   ❌ Login Failed for ${u.email}: ${e.message}`);
            console.log(`   💡 ACTION REQUIRED: Please create this user manually via the App (Admin > Usuarios) or Firebase Console.`);
        }
    }
}

setupUsers();
