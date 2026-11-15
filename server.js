require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TournamentHub API is working" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Server: http://localhost:${process.env.PORT || 3000}`)
    );
  })
  .catch((err) => console.error("DB error:", err.message));