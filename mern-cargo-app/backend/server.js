require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const containerRoutes = require("./routes/containerRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/containers", containerRoutes);

// Serve the built React app (frontend/build) as static files.
// Run `npm run build` inside /frontend before starting this server
// (or when deploying), so this folder exists.
const buildPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildPath));

// Any request that isn't an API route falls through to React's index.html
// (lets React Router handle client-side routes like /containers/MSCU1234567)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// 404 handler (only reached for unmatched /api routes now)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
