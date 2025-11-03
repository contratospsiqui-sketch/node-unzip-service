import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import AdmZip from "adm-zip";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));

// Endpoint principal
app.post("/unzip", async (req, res) => {
  try {
    const { fileData, fileName, password } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: "Missing filename or filedata" });
    }

    // Decodificar base64
    const buffer = Buffer.from(fileData, "base64");
    const zip = new AdmZip(buffer, password ? { password } : undefined);
    const zipEntries = zip.getEntries();

    const archivos = zipEntries.map((entry) => {
      const contenido = entry.getData().toString("base64");
      return {
        fileName: entry.entryName,
        mimeType: entry.entryName.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : entry.entryName.toLowerCase().endsWith(".xml")
          ? "application/xml"
          : "application/octet-stream",
        content: contenido,
      };
    });

    console.log(`✅ ZIP procesado (${fileName}) con ${archivos.length} archivos.`);
    res.json(archivos);
  } catch (err) {
    console.error("❌ Error al descomprimir:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Microservicio ejecutándose en puerto ${PORT}`));
