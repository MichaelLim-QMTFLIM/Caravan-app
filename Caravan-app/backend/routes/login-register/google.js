const express = require("express");
const app = express.Router();

const db = require("../../imports/database");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");

const JWT_SECRET = process.env.JWT_SECRET;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
);

app.customPath = "/api";

/*
 * STEP 1
 * Send the user to Google
 */
app.get("/auth/google", (req, res) => {
  console.log("Route hit: /auth/google");
  const url = googleClient.generateAuthUrl({
    access_type: "offline",

    scope: ["openid", "email", "profile"],

    prompt: "select_account",
  });

  res.redirect(url);
});

/*
 * STEP 2
 * Google redirects the user here
 */
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      res.redirect("/");
    }

    /*
     * Exchange Google's authorization code
     * for Google tokens.
     */
    const { tokens } = await googleClient.getToken(code);

    /*
     * Verify Google's ID token.
     */
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        error: "Invalid Google identity",
      });
    }

    const {
      sub: googleId,
      email,
      given_name,
      family_name,
      email_verified,
    } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({
        error: "Google email is not verified",
      });
    }

    /*
     * Find an existing customer.
     */
    const existingUser = await db.execute({
      sql: `
        SELECT *
        FROM Customer
        WHERE Cus_email = ?
      `,
      args: [email],
    });

    let user;

    if (existingUser.rows.length > 0) {
      /*
       * Existing account
       */
      user = existingUser.rows[0];
    } else {
      /*
       * First Google login.
       *
       * Create a normal Customer account.
       */
      const result = await db.execute({
        sql: `
    INSERT INTO Customer (
      first_name,
      last_name,
      Cus_email,
      Cus_password,
      google_id
    )
    VALUES (?, ?, ?, ?, ?)
  `,
        args: [given_name || "", family_name || "", email, null, googleId],
      });

      if (result.affectedRows === 0) {
        return res.status(500).json({
          error: "Failed to create account",
        });
      }

      /*
       * Get the newly created user.
       */
      const createdUser = await db.execute({
        sql: `
          SELECT *
          FROM Customer
          WHERE Cus_email = ?
        `,
        args: [email],
      });

      user = createdUser.rows[0];
    }

    /*
     * Create YOUR application's JWT.
     */
    const token = jwt.sign(
      {
        userId: user.Customer_id,
        email: user.Cus_email,
        role: "user",
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    /*
     * Same cookie system as normal login.
     */
    res.cookie("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    /*
     * Send the user back to your frontend.
     */
    return res.redirect("/");
  } catch (err) {
    console.error("Google login error:", err);

    return res.status(500).json({
      error: "Google authentication failed",
    });
  }
});

module.exports = app;
