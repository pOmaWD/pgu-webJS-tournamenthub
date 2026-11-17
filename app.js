const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "TournamentHub API is working" });
});

module.exports = app;