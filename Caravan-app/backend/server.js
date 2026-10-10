const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cookieParser = require("cookie-parser");

const requiredEnvironment = ["TURSO_LINK", "TURSO_TOKEN", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing required backend environment variables: ${missingEnvironment.join(", ")}. ` +
      "Copy backend/.env.example to backend/.env and fill in the values.",
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

function loadRoutes(directory) {
  for (const file of fs.readdirSync(directory).sort()) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      loadRoutes(filePath);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    const router = require(filePath);
    const routePrefix = router.customPath || `/${path.basename(file, ".js")}`;
    app.use(routePrefix, router);
    console.log(`Mounted ${path.relative(__dirname, filePath)} -> ${routePrefix}`);
  }
}

loadRoutes(path.join(__dirname, "routes"));

app.use((_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Caravan API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
