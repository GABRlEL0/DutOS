
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
    console.log("🤖 Starting PRODUCTION Role Logic Verification Tests...");

    // 1. Setup: Login as Admin to create an Approved Post
    let postId;
    let adminUid;

    try {
        const cred = await signInWithEmailAndPassword(auth, "admin_qa@dutos.com", "password123");
        adminUid = cred.user.uid;
        const dummyClientId = "dummy-client-prod";

        // Create Approved Post
        const p1 = await addDoc(collection(db, "posts"), {
            client_id: dummyClientId,
            type: "feed",
            status: "approved", // Start as approved
            pillar: "Content",
            content: {
                script: "Prod Script",
                caption: "Prod Caption",
                asset_link: ""
            },
            createdBy: adminUid,
            createdAt: serverTimestamp()
        });
        postId = p1.id;
        console.log(`✅ Setup: Approved Post Created (${postId})`);

        await signOut(auth);

    } catch (e) {
        console.error(`❌ Setup Failed: ${e.message}`);
        process.exit(1);
    }

    // 2. Login as Production
    try {
        const cred = await signInWithEmailAndPassword(auth, "prod_qa@dutos.com", "password123");
        console.log(`✅ Login successful as: ${cred.user.email}`);
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        process.exit(1);
    }

    // Test F01-B: Mark Asset Ready (Update Link)
    try {
        console.log("👉 Testing F01-B: Add Asset Link...");
        await updateDoc(doc(db, "posts", postId), {
            "content.asset_link": "https://drive.google.com/file/d/123"
        });
        console.log("✅ F01-B PASS: Asset Link Updated.");
    } catch (e) {
        console.error(`❌ F01-B FAIL: ${e.message}`);
    }

    // Test F01-C: Mark as Finished
    try {
        console.log("👉 Testing F01-C: Mark as Finished...");
        await updateDoc(doc(db, "posts", postId), {
            status: "finished"
        });

        // Verify
        const pSnap = await getDoc(doc(db, "posts", postId));
        if (pSnap.data().status === "finished") {
            console.log("✅ F01-C PASS: Post status updated to finished.");
        } else {
            console.error("❌ F01-C FAIL: Status update failed.");
        }
    } catch (e) {
        console.error(`❌ F01-C FAIL: ${e.message}`);
    }

    // Cleanup (Need Admin again? Prod might not be able to delete)
    // Let's try to delete as prod, expect fail, then just leave it or use a cleanup script.
    // Actually, for simplicity in these one-off scripts, leaving a few docs in a test DB is often acceptable if we don't have a clean teardown util.
    // But let's try to be clean.

    if (postId) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            console.warn("   (Prod deleted post? Check rules. Usually Admin only.)");
        } catch (e) {
            console.log("   (Cleanup skipped: Prod cannot delete. Expected.)");
        }
    }

    console.log("🏁 Production Tests Completed.");
    process.exit(0);
}

runTests();
