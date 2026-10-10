const express = require("express");
const app = express.Router();

/*
const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

app.get("/send-email", async (req, res) => {
  try {
    console.log("sending");
    const data = await mg.messages.create(`${process.env.MAILGUN_DOMAIN}`, {
      from: `Mailgun Sandbox <postmaster@${process.env.MAILGUN_DOMAIN}>`,
      to: ["ID ML GL <qimmghazal@tip.edu.ph>"],
      subject: "Hello ID ML GL",
      text: "Congratulations ID ML GL, you just sent an email with Mailgun! You are truly awesome! quad.",
    });

    console.log(data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});*/

module.exports = app;
