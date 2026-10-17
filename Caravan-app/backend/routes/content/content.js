const express = require("express");
const app = express.Router();
const db = require("../../imports/database");
app.customPath = "/api";

app.get("/content", async (req, res) => {

    try {
        const result = await db.execute({
            sql: `
                SELECT
                    c.content_id AS contentId,
                    c.Main_text AS mainText,
                    c.update_date AS updateDate,
                    c.content_type_id AS contentTypeId,
                    ct.content_type_name AS contentTypeName
                FROM Content c
                INNER JOIN Content_type ct
                    ON c.content_type_id = ct.content_type_id
                ORDER BY
                    c.content_type_id,
                    c.content_id
            `
        });

        res.set("Cache-Control", "no-store");

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error("Content API error:", error);

        return res.status(500).json({
            error: "Unable to retrieve site content"
        });
    }
});

module.exports = app;