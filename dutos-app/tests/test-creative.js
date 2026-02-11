
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

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
    console.log("🤖 Starting CREATIVE Role Logic Verification Tests...");

    // 1. Login as Creative
    try {
        const cred = await signInWithEmailAndPassword(auth, "creative_qa@dutos.com", "password123");
        console.log(`✅ Login successful as: ${cred.user.email}`);
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        process.exit(1);
    }

    // Setup: Create a Post (Creatives can create)
    // We need a client ID. Creatives don't need assigned client to create generally?
    // Rules: allow create if role is creative.
    let postId;
    const dummyClientId = "dummy-client-creative";

    try {
        console.log("👉 Testing Post Workflow (W01)...");
        const p1 = await addDoc(collection(db, "posts"), {
            client_id: dummyClientId,
            type: "feed",
            status: "draft",
            pillar: "Content",
            content: {
                script: "Creative Script",
                caption: "Creative Caption",
                asset_link: ""
            },
            createdBy: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });
        postId = p1.id;
        console.log(`✅ Post Created by Creative (${postId})`);
    } catch (e) {
        console.error(`❌ Post Creation Failed: ${e.message}`);
        process.exit(1);
    }

    // Test R01-B: Try to Approve (Should Fail)
    try {
        console.log("👉 Testing R01-B: Restricted Approval...");
        await updateDoc(doc(db, "posts", postId), {
            status: "approved"
        });
        console.error("❌ R01-B FAIL: Creative was able to approve post!");
    } catch (e) {
        if (e.message.includes("permission-denied") || e.code === 'permission-denied') {
            console.log("✅ R01-B PASS: Creative cannot approve post (Permission Denied).");
        } else {
            console.error(`⚠️ R01-B Unexpected Error: ${e.message}`);
        }
    }

    // Test W01-C: Submit for Approval (Pending) - Should Pass
    try {
        console.log("👉 Testing W01-C: Submit for Approval...");
        await updateDoc(doc(db, "posts", postId), {
            status: "pending_approval"
        });
        console.log("✅ W01-C PASS: Post status updated to pending_approval.");
    } catch (e) {
        console.error(`❌ W01-C FAIL: ${e.message}`);
    }

    // Test R01-C: Try to Edit Client (Brand Kit) - Should Fail
    try {
        console.log("👉 Testing R01-C: Restricted Client Edit...");
        // Try to update a non-existent client (permissions check happens before existence check usually for writes? Or maybe not.
        // Actually, we need a valid client doc path to test allow write rules, even if it doesn't exist, Create rule might trigger.
        // Let's try to update the dummy client we used (which surely doesn't exist, but we should try to write to it).
        // Rules: match /clients/{clientId} allow write: admin/manager.

        await updateDoc(doc(db, "clients", dummyClientId), {
            "brand_kit.voice_tone": "Hacked"
        });
        console.error("❌ R01-C FAIL: Creative was able to update Client!");
    } catch (e) {
        if (e.message.includes("permission-denied") || e.code === 'permission-denied' || e.message.includes("NOT_FOUND")) {
            // NOT_FOUND might happen if we try updateDoc on missing doc.
            // Let's try setDoc to be sure we hit the write rule.
            try {
                const { setDoc } = require("firebase/firestore"); // import dynamically or assumed
                await setDoc(doc(db, "clients", dummyClientId), { name: "Hacked" });
                console.error("❌ R01-C FAIL: Creative was able to create/write Client!");
            } catch (e2) {
                if (e2.message.includes("permission-denied") || e2.code === 'permission-denied') {
                    console.log("✅ R01-C PASS: Creative cannot write to Clients (Permission Denied).");
                } else {
                    console.log(`⚠️ R01-C Note: ${e2.message}`);
                }
            }
        } else {
            console.error(`⚠️ R01-C Unexpected Error: ${e.message}`);
        }
    }

    // Cleanup
    console.log("🧹 Cleanup...");
    if (postId) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            // This might FAIL if Creatives don't have delete permission (Admin only!).
            console.warn("   (Note: Delete might fail as User is Creative. This is expected.)");
        } catch (e) {
            console.log("   ✅ Cleanup verified: Creative cannot delete post (Permission Denied).");
        }
    }

    // Real Cleanup (Admin Login)
    // ... omitting for brevity, manual cleanup or separate admin script is fine.

    console.log("🏁 Creative Tests Completed.");
    process.exit(0);
}

runTests();
