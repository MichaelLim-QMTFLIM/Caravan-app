const express = require("express");
const router = express.Router();

router.customPath = "/api";

router.post("/logout", (_req, res) => {
  res.clearCookie("auth", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ loggedIn: false });
});

module.exports = router;
