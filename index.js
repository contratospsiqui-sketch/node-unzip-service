/**
 * Node Unzip Service (versión con soporte de contraseña)
 * Autor: Dr. Alfredo Pugliese Jiménez
 * Fecha: 2025-11-02
 */

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import os from "os";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

/**
 * Endpoint principal /unzip
 * Recibe JSON con:
 *  - filename
 *  - filedata (base64)
 *  - password (opcional)
 */
app.post("/unzip", async (req, res) => {
  try {
    const { filename, filedata, password } = req.body;
    if (!filename || !filedata) {
      return res.status(400).json({ error: "Missing filename or filedata" });
    }

    console.log(`🧩 Procesando archivo: ${filename}`);

    // Guardar archivo temporal
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "unzipsvc-"));
    const zipPath = path.join(tempDir, filename);
    fs.writeFileSync(zipPath, Buffer.from(filedata, "base64"));

    let zip;
    try {
      // Intento normal
      zip = new AdmZip(zipPath);
      zip.getEntries();
    } catch (err) {
      if (password) {
        console.log("🔐 Intentando descomprimir con contraseña...");
        zip = new AdmZip(zipPath, password);
      } else {
        throw new Error("Invalid or encrypted ZIP, no password provided");
      }
    }

    const files = [];
    zip.getEntries().forEach((entry) => {
      if (entry.isDirectory) return;
      const ext = path.extname(entry.entryName).toLowerCase();
      if (ext === ".pdf" || ext === ".xml") {
        const data = entry.getData();
        files.push({
          name: path.basename(entry.entryName),
          content: data.toString("base64"),
        });
        console.log(`✅ Archivo extraído: ${entry.entryName}`);
      } else {
        console.log(`📄 Archivo omitido: ${entry.entryName}`);
      }
    });

    fs.unlinkSync(zipPath);
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (files.length === 0) {
      return res.status(422).json({ error: "No PDF/XML files found" });
    }

    res.json({ files });
  } catch (error) {
    console.error("❌ Error al procesar ZIP:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Microservicio ejecutándose en puerto ${PORT}`);
});
