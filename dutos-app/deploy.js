import * as ftp from 'basic-ftp';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
    const client = new ftp.Client()
    client.ftp.verbose = true

    const config = {
        host: process.env.FTP_HOST || "duts.com.ar",
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: false // Try plain FTP first, usually shared hosting default
    }

    try {
        console.log("Connecting to FTP...");
        await client.access(config)
        console.log("Connected!");

        console.log("Uploading files from dist/ to public_html/ (or root)...");
        // Often shared hosting puts files in public_html or www. 
        // We will try to upload to root directory first, assuming the user root IS the web root for this user.
        // If it fails or looks wrong, we might need adjustments. 
        // But for a specific FTP user like DutOS@duts.com.ar, usually the root is the right place.

        await client.ensureDir("/")
        await client.clearWorkingDir()
        await client.uploadFromDir(path.join(__dirname, "dist"), "/")

        console.log("Upload success!");
    }
    catch (err) {
        console.log("Error:", err);
        process.exit(1);
    }
    client.close()
}

deploy();
