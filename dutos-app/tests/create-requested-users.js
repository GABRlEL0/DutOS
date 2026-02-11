
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
    { email: "admin@duts.com", password: "password", role: "admin", name: "Admin Duts" },
    { email: "manager@duts.com", password: "password", role: "manager", name: "Manager Duts" },
    { email: "creative@duts.com", password: "password", role: "creative", name: "Creative Duts" },
    { email: "production@duts.com", password: "password", role: "production", name: "Production Duts" }
];

async function createRequestedUsers() {
    console.log("🤖 Creating Requested Users (@duts.com)...");

    // 1. Login as Existing Admin (to have permission to write to Firestore)
    try {
        // Trying with the previously working QA admin
        await signInWithEmailAndPassword(auth, "admin_qa@dutos.com", "password123");
        console.log("✅ Main App: Admin Logged In (admin_qa@dutos.com)");
    } catch (e) {
        console.error("❌ Admin Login Failed:", e.message);
        // Fallback: Try the new admin credentials if they already exist? 
        // Or just try to continue, maybe rules allow create own profile?
        // Actually, if we are creating 'admin@duts.com', maybe we can use it to create others after it's created?
        // For now, assume admin_qa exists from previous steps.
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

createRequestedUsers();
