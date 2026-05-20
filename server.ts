import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Firebase Admin for secure server-side operations
try {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id
      });
    } else {
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
    }
  }
} catch (err) {
  console.warn("Firebase Admin Initialization Warning:", err);
}

const dbAdmin = admin.apps.length ? admin.firestore() : null;

app.use(express.json());

// API Route to proxy Apps Script requests
app.all("/api/sheets-sync", async (req, res) => {
  // Explicitly handle method to avoid 405 on some platforms if they probe
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", message: "Use POST to sync leads." });
  }

  try {
    const { clientId, data } = req.body;
    
    if (!clientId) {
      console.error("Sync Error: Missing clientId in request body");
      return res.status(400).json({ error: "Missing clientId" });
    }

    let sheetUrl = req.body.sheetUrl;

    if (!sheetUrl && dbAdmin) {
      try {
        const clientDoc = await dbAdmin.collection("clients").doc(clientId).get();
        if (clientDoc.exists) {
          sheetUrl = clientDoc.get("sheetUrl");
        }
      } catch (dbErr) {
        console.error("Firestore Admin Lookup Error:", dbErr);
      }
    }

    if (!sheetUrl) {
      console.warn(`Sync Warning: No sheetUrl found for clientId: ${clientId}`);
      return res.status(200).json({ 
        success: true, 
        warning: "Sheet URL not configured, leads saved to Firestore only."
      });
    }

    console.log(`Syncing lead to: ${sheetUrl}`);
    const response = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get("content-type");
    let result: any = { status: "success" };
    
    try {
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { status: "success", message: text };
      }
    } catch (parseErr) {
      console.warn("Apps Script parsing warning:", parseErr);
    }

    if (!response.ok) {
      console.error(`Apps Script Sync Failure: ${response.status}`);
      return res.status(response.status).json({ error: "Apps Script error", details: result });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("System Sync Error:", err);
    return res.status(200).json({ 
      success: true, 
      warning: "Firestore saved, but sheet sync failed.",
      details: err.message 
    });
  }
});

// Setup Vite or Static Serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  // Start listener if not in serverless environment
  if (!process.env.VERCEL && !process.env.AWS_EXECUTION_ENV) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupServer();

export default app;
