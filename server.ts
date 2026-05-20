
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
// Note: In this environment, we might need to rely on environment variables 
// or the provided config. For now, we'll try to initialize with the project ID.
import firebaseConfig from "./firebase-applet-config.json";

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const db = getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Google Sheets Sync
  app.post("/api/sheets-sync", async (req, res) => {
    try {
      const leadData = req.body;
      
      // 1. Fetch sheetUrl from clients collection
      // Usually, there might be a single config doc in a clients or settings collection
      const clientSnap = await db.collection("clients").doc("main_config").get();
      let sheetUrl = "";
      
      if (clientSnap.exists) {
        sheetUrl = clientSnap.data()?.sheetUrl || "";
      } else {
        // Fallback or check if there's any doc with sheetUrl
        const clientsQuery = await db.collection("clients").limit(1).get();
        if (!clientsQuery.empty) {
          sheetUrl = clientsQuery.docs[0].data()?.sheetUrl || "";
        }
      }

      if (!sheetUrl) {
        console.warn("No sheetUrl found in clients collection");
        return res.json({ success: true, message: "No sheetUrl configured, but lead saved to DB" });
      }

      // 2. Send to Google Apps Script
      // We expect sheetUrl to be the Web App URL of the Apps Script
      try {
        const response = await fetch(sheetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leadData),
        });

        // 3. Response handling (Non-blocking as requested)
        const result = await response.text();
        console.log("Sheets Sync Response:", result);
      } catch (e) {
        console.error("Fetch to sheets GAS failed:", e);
      }

      return res.json({ success: true, message: "Sync attempt completed" });
    } catch (error) {
      console.error("Sheet Sync Error:", error);
      // Always return valid JSON even on error
      return res.json({ success: true, error: "Sync failed but lead saved" });
    }
  });

  // Vite middleware for development
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
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
