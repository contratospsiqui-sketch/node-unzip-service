const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

// Ruta principal para recibir el ZIP
app.post("/unzip", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const extractPath = path.join("extracted", Date.now().toString());
    fs.mkdirSync(extractPath, { recursive: true });

    // Extraer los archivos del ZIP
    await fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    // Generar lista de archivos extraídos
    const files = fs.readdirSync(extractPath).map(f => ({
      name: f,
      url: `${req.protocol}://${req.get("host")}/files/${path.basename(extractPath)}/${f}`
    }));

    // Enviar respuesta con los enlaces de descarga
    res.json({ success: true, files });

    // Limpiar archivo temporal
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("❌ Error al procesar ZIP:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Servir los archivos extraídos
app.use("/files", express.static("extracted"));

// Iniciar el servidor
app.listen(PORT, () => console.log(`✅ Microservicio ejecutándose en puerto ${PORT}`));
