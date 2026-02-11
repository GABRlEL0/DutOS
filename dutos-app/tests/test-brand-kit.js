
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
    console.log("🤖 Starting ADMIN-03 (Brand Kit) Logic Verification Tests...");

    // 1. Login
    try {
        await signInWithEmailAndPassword(auth, "admin_qa@dutos.com", "password123");
        console.log("✅ Login successful");
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        process.exit(1);
    }

    let clientId;

    // 2. Setup: Create a Client
    try {
        const docRef = await addDoc(collection(db, "clients"), {
            name: "QA Brand Kit Client",
            monthly_capacity: 5,
            pillars: ["Test"],
            createdAt: new Date(),
            status: "active"
        });
        clientId = docRef.id;
        console.log(`✅ Setup: Client created with ID: ${clientId}`);
    } catch (e) {
        console.error(`❌ Setup Failed: ${e.message}`);
        process.exit(1);
    }

    // 3. Update Client with Brand Kit (B01-B, B01-C, B01-D)
    if (clientId) {
        try {
            console.log("👉 Adding Brand Kit data (Colors, Typography, Assets)...");

            const brandKitData = {
                brand_kit: {
                    colors: [
                        { id: "c1", name: "Primary Blue", hex: "#0000FF" },
                        { id: "c2", name: "Accent Orange", hex: "#FFA500" }
                    ],
                    typography: [
                        { id: "t1", family: "Roboto", usage: "header" }
                    ],
                    assets: [
                        { id: "a1", name: "Logo Main", url: "https://example.com/logo.png", type: "logo" }
                    ],
                    voice_tone: "Professional and clean"
                }
            };

            await updateDoc(doc(db, "clients", clientId), brandKitData);
            console.log("✅ Brand Kit data sent to Firestore.");

            // 4. Verify Persistence (B01-E)
            const snap = await getDoc(doc(db, "clients", clientId));
            const data = snap.data();
            const bk = data.brand_kit;

            if (bk && bk.colors.length === 2 && bk.typography[0].family === "Roboto" && bk.assets[0].type === "logo") {
                console.log("✅ B01-E PASS: Brand Kit data persisted correctly.");
                console.log("   - Colors Verified: " + bk.colors.length);
                console.log("   - Typography Verified: " + bk.typography[0].family);
                console.log("   - Assets Verified: " + bk.assets[0].name);
            } else {
                console.error("❌ B01-E FAIL: Data mismatch.");
                console.error("Received:", JSON.stringify(bk, null, 2));
            }

        } catch (e) {
            console.error(`❌ Brand Kit Update FAIL: ${e.message}`);
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

    console.log("🏁 Brand Kit Tests Completed.");
    process.exit(0);
}

runTests();
