
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8kU9fvYU9sfl80Se0k_AffEsgLVpxpAg",
    authDomain: "dutos-agency-os-2026.firebaseapp.com",
    projectId: "dutos-agency-os-2026",
    storageBucket: "dutos-agency-os-2026.firebasestorage.app",
    messagingSenderId: "132404399654",
    appId: "1:132404399654:web:817b8b8cc1e52d4409e0e7"
};

// 1. Primary App (Admin) - Used for Firestore writes
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Secondary App - Used for creating new users without logging out Admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

const usersToCreate = [
    { email: "manager_qa@dutos.com", password: "password123", role: "manager", name: "Manager QA" },
    { email: "creative_qa@dutos.com", password: "password123", role: "creative", name: "Creative QA" },
    { email: "prod_qa@dutos.com", password: "password123", role: "production", name: "Production QA" },
    { email: "client_qa@dutos.com", password: "password123", role: "client", name: "Client QA", assigned_client_id: "client-id-placeholder" }
];

async function createTestUsers() {
    console.log("🤖 Creating Test Users...");

    // 1. Login as Admin on Main App
    try {
        await signInWithEmailAndPassword(auth, "admin_qa@dutos.com", "password123");
        console.log("✅ Main App: Admin Logged In");
    } catch (e) {
        console.error("❌ Admin Login Failed:", e.message);
        process.exit(1);
    }

    for (const u of usersToCreate) {
        console.log(`👉 Processing ${u.email}...`);

        let uid = null;

        // Try to login on secondary app to see if exists
        try {
            const cred = await signInWithEmailAndPassword(secondaryAuth, u.email, u.password);
            uid = cred.user.uid;
            console.log(`   ℹ️ Auth User already exists (UID: ${uid})`);
        } catch (e) {
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
                // Create it
                try {
                    const cred = await createUserWithEmailAndPassword(secondaryAuth, u.email, u.password);
                    uid = cred.user.uid;
                    console.log(`   ✅ Auth User Created (UID: ${uid})`);
                } catch (createErr) {
                    console.error(`   ❌ Failed to create auth user ${u.email}:`, createErr.message);
                    continue;
                }
            } else {
                console.error(`   ❌ Error checking auth for ${u.email}:`, e.message);
                continue;
            }
        }

        // Now ensure Firestore data exists (using Main App Admin Auth)
        if (uid) {
            try {
                const userRef = doc(db, "users", uid);
                const snap = await getDoc(userRef);

                const userData = {
                    id: uid,
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    status: "active",
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                if (u.assigned_client_id) {
                    userData.assigned_client_id = u.assigned_client_id;
                }

                await setDoc(userRef, userData, { merge: true });
                console.log(`   ✅ Firestore Profile Updated/Created for ${u.role}`);
            } catch (fsErr) {
                console.error(`   ❌ Firestore Write Failed for ${u.email}:`, fsErr.message);
            }
        }
    }

    console.log("🏁 User Creation Script Finished.");
    process.exit(0);
}

createTestUsers();
