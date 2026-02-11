
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

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

async function runTests() {
    console.log("🤖 Starting ADMIN-02 Logic Verification Tests...");

    // 1. Login
    try {
        const userCredential = await signInWithEmailAndPassword(auth, "admin_qa@dutos.com", "password123");
        console.log(`✅ Login successful as: ${userCredential.user.email}`);
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        if (e.code === 'auth/invalid-credential') {
            console.log("⚠️ Hint: Try re-running the setup if user is missing.");
        }
        process.exit(1);
    }

    let clientId;

    // 2. Create Client (C01-A)
    try {
        console.log("👉 Attempting to create 'QA Test Client'...");
        const docRef = await addDoc(collection(db, "clients"), {
            name: "QA Test Client",
            monthly_capacity: 5,
            pillars: ["Ventas", "Branding"],
            createdAt: new Date(),
            status: "active"
        });
        clientId = docRef.id;
        console.log(`✅ C01-A PASS: Client created with ID: ${clientId}`);
    } catch (e) {
        console.error(`❌ C01-A FAIL: ${e.message}`);
    }

    // 3. Verify Client Exists & Search Logic (C01-D Equivalent)
    if (clientId) {
        try {
            console.log("👉 Verifying client data persistence...");
            const snap = await getDoc(doc(db, "clients", clientId));
            if (snap.exists() && snap.data().name === "QA Test Client") {
                console.log("✅ Data Verification PASS: Client found and name matches.");
            } else {
                console.error("❌ Data Verification FAIL: Client not found or name mismatch.");
            }
        } catch (e) {
            console.error(`❌ Verification Error: ${e.message}`);
        }
    }

    // 4. Update Client (C01-C)
    if (clientId) {
        try {
            console.log("👉 Attempting to update client capacity and link...");
            await updateDoc(doc(db, "clients", clientId), {
                monthly_capacity: 10,
                drive_link: "https://drive.google.com/drive/folders/test"
            });

            const snap = await getDoc(doc(db, "clients", clientId));
            const data = snap.data();
            if (data.monthly_capacity === 10 && data.drive_link) {
                console.log("✅ C01-C PASS: Client updated successfully (Capacity: 10).");
            } else {
                console.error("❌ C01-C FAIL: Update not reflected.");
            }
        } catch (e) {
            console.error(`❌ C01-C FAIL: ${e.message}`);
        }
    }

    // 5. Clean up
    if (clientId) {
        try {
            await deleteDoc(doc(db, "clients", clientId));
            console.log("✅ Cleanup: Test client deleted.");
        } catch (e) {
            console.error("⚠️ Cleanup Failed:", e.message);
        }
    }

    console.log("🏁 Tests Completed.");
    process.exit(0);
}

runTests();
