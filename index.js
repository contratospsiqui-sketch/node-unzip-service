const express = require("express");
const AdmZip = require("adm-zip");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/unzip", (req, res) => {
  try {
    const { filename, filedata } = req.body;
    if (!filedata) throw new Error("No se recibió archivo");

    const buffer = Buffer.from(filedata, "base64");
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const files = entries.map(e => ({
      name: e.entryName,
      content: e.getData().toString("base64")
    }));

    res.json({ files });
  } catch (err) {
    console.error("Error al descomprimir:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(10000, () => console.log("✅ Microservicio ejecutándose en puerto 10000"));
