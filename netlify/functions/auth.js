const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
};

const JWT_SECRET = process.env.JWT_SECRET || "bookshelf-secret-key-2025";

exports.handler = async function (event, context) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const body = JSON.parse(event.body || "{}");
    const { action } = body;

    try {
        // ============ REGISTER ============
        if (action === "register") {
            const { name, email, password } = body;

            if (!name || !email || !password) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Nama, email, dan password wajib diisi" }),
                };
            }

            // Check if email already exists
            const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
            if (existing.length > 0) {
                return {
                    statusCode: 409,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Email sudah terdaftar" }),
                };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await sql`
                INSERT INTO users (name, email, password)
                VALUES (${name}, ${email}, ${hashedPassword})
                RETURNING id, name, email
            `;

            const user = result[0];
            const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    user: { id: user.id, name: user.name, email: user.email },
                    token,
                }),
            };
        }

        // ============ LOGIN ============
        if (action === "login") {
            const { email, password } = body;

            if (!email || !password) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Email dan password wajib diisi" }),
                };
            }

            const result = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (result.length === 0) {
                return {
                    statusCode: 401,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Email atau password salah" }),
                };
            }

            const user = result[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return {
                    statusCode: 401,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Email atau password salah" }),
                };
            }

            const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    user: { id: user.id, name: user.name, email: user.email },
                    token,
                }),
            };
        }

        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Action harus 'login' atau 'register'" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
