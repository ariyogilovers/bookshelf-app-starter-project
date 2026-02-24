const { neon } = require("@neondatabase/serverless");

exports.handler = async function (event, context) {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS books (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                year INTEGER NOT NULL,
                is_complete BOOLEAN DEFAULT FALSE
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS films (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                director VARCHAR(255) NOT NULL,
                year INTEGER NOT NULL,
                is_complete BOOLEAN DEFAULT FALSE
            )
        `;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, message: "Tables books & films created successfully" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
