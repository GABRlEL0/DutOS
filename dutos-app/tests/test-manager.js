
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

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
    console.log("🤖 Starting MANAGER Role Logic Verification Tests...");

    // 1. Login as Manager
    let managerUid;
    try {
        const cred = await signInWithEmailAndPassword(auth, "manager_qa@dutos.com", "password123");
        managerUid = cred.user.uid;
        console.log(`✅ Login successful as: ${cred.user.email}`);
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        process.exit(1);
    }

    // Setup: Create a Client (Managers have permission)
    let clientId;
    try {
        const docRef = await addDoc(collection(db, "clients"), {
            name: "Manager Test Client",
            monthly_capacity: 5,
            pillars: ["Content", "Ads"],
            createdAt: new Date(),
            status: "active"
        });
        clientId = docRef.id;
        console.log(`✅ Setup: Client created (ID: ${clientId})`);
    } catch (e) {
        console.error(`❌ Setup Failed (Client Creation): ${e.message}`);
        process.exit(1);
    }

    // MGR-01: Templates
    let templateId;
    try {
        console.log("👉 Testing MGR-01: Templates...");
        // Create Global Template
        const t1 = await addDoc(collection(db, "content_templates"), {
            name: "Global Template",
            description: "For everyone",
            script_template: "Intro...",
            caption_template: "Caption...",
            tags: ["global"],
            created_by: managerUid,
            createdAt: serverTimestamp()
        });
        templateId = t1.id;
        console.log(`✅ T01-A PASS: Global Template Created (${templateId})`);

        // Edit Template
        await updateDoc(doc(db, "content_templates", templateId), {
            description: "Updated Description"
        });
        const tSnap = await getDoc(doc(db, "content_templates", templateId));
        if (tSnap.data().description === "Updated Description") {
            console.log(`✅ T01-C PASS: Template Edited`);
        } else {
            console.error(`❌ T01-C FAIL: Edit not persisted`);
        }
    } catch (e) {
        console.error(`❌ MGR-01 FAIL: ${e.message}`);
    }

    // MGR-02: Post Lifecycle
    let postId;
    try {
        console.log("👉 Testing MGR-02: Post Lifecycle...");

        // Create Post (P01-A)
        const p1 = await addDoc(collection(db, "posts"), {
            client_id: clientId,
            type: "feed",
            status: "draft",
            pillar: "Content",
            content: {
                script: "Draft Script",
                caption: "Draft Caption",
                asset_link: ""
            },
            createdBy: managerUid,
            createdAt: serverTimestamp()
        });
        postId = p1.id;
        console.log(`✅ P01-A PASS: Post Created (${postId})`);

        // Edit Post (P01-B)
        await updateDoc(doc(db, "posts", postId), {
            "content.script": "Updated Script"
        });
        console.log(`✅ P01-B PASS: Post Edited`);

        // Approve Post (P01-C)
        await updateDoc(doc(db, "posts", postId), {
            status: "approved"
        });
        const pSnap = await getDoc(doc(db, "posts", postId));
        if (pSnap.data().status === "approved") {
            console.log(`✅ P01-C PASS: Post Approved`);
        } else {
            console.error(`❌ P01-C FAIL: Status change failed`);
        }

    } catch (e) {
        console.error(`❌ MGR-02 FAIL: ${e.message}`);
    }

    // MGR-03: Comments
    try {
        console.log("👉 Testing MGR-03: Comments...");
        if (postId) {
            await addDoc(collection(db, `posts/${postId}/comments`), {
                post_id: postId,
                user_id: managerUid,
                user_name: "Manager QA",
                user_role: "manager",
                message: "Looks good!",
                createdAt: serverTimestamp()
            });
            console.log(`✅ COM-01 PASS: Comment Added`);

            // Verify
            const cSnap = await getDocs(collection(db, `posts/${postId}/comments`));
            if (!cSnap.empty) {
                console.log(`✅ Comment verified in DB (Count: ${cSnap.size})`);
            }
        }
    } catch (e) {
        console.error(`❌ MGR-03 FAIL: ${e.message}`);
    }

    // Cleanup
    console.log("🧹 Cleanup...");
    if (postId) await deleteDoc(doc(db, "posts", postId)); // Note: Subcollection comments might remain, requires recursive delete usually, but okay for test
    if (templateId) await deleteDoc(doc(db, "content_templates", templateId));
    if (clientId) await deleteDoc(doc(db, "clients", clientId));

    console.log("🏁 Manager Tests Completed.");
    process.exit(0);
}

runTests();
