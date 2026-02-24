const { neon } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
};

const JWT_SECRET = process.env.JWT_SECRET || "bookshelf-secret-key-2025";

function getUserFromToken(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

exports.handler = async function (event, context) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    const user = getUserFromToken(event);
    if (!user) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    try {
        // GET — list books
        if (event.httpMethod === "GET") {
            const params = event.queryStringParameters || {};
            const search = params.search;
            const shared = params.shared === "true";

            let books;

            if (shared) {
                // Shared: get all books from all users with owner name
                if (search) {
                    books = await sql`
                        SELECT b.*, u.name AS owner_name
                        FROM books b LEFT JOIN users u ON b.user_id = u.id
                        WHERE LOWER(b.title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY b.id DESC
                    `;
                } else {
                    books = await sql`
                        SELECT b.*, u.name AS owner_name
                        FROM books b LEFT JOIN users u ON b.user_id = u.id
                        ORDER BY b.id DESC
                    `;
                }
            } else {
                // Personal: only this user's books
                if (search) {
                    books = await sql`
                        SELECT * FROM books
                        WHERE user_id = ${user.id} AND LOWER(title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY id DESC
                    `;
                } else {
                    books = await sql`
                        SELECT * FROM books WHERE user_id = ${user.id} ORDER BY id DESC
                    `;
                }
            }

            const mapped = books.map(row => ({
                id: Number(row.id),
                title: row.title,
                author: row.author,
                year: row.year,
                isComplete: row.is_complete,
                userId: row.user_id,
                ownerName: row.owner_name || null,
            }));

            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(mapped) };
        }

        // POST — add book
        if (event.httpMethod === "POST") {
            const { id, title, author, year, isComplete } = JSON.parse(event.body);

            const result = await sql`
                INSERT INTO books (id, title, author, year, is_complete, user_id)
                VALUES (${id}, ${title}, ${author}, ${year}, ${isComplete}, ${user.id})
                RETURNING *
            `;

            const row = result[0];
            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, author: row.author,
                    year: row.year, isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // PUT — update book (only own books)
        if (event.httpMethod === "PUT") {
            const { id, title, author, year, isComplete } = JSON.parse(event.body);

            const result = await sql`
                UPDATE books
                SET title = ${title}, author = ${author}, year = ${year}, is_complete = ${isComplete}
                WHERE id = ${id} AND user_id = ${user.id}
                RETURNING *
            `;

            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Book not found" }) };
            }

            const row = result[0];
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, author: row.author,
                    year: row.year, isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // DELETE — delete book (only own books)
        if (event.httpMethod === "DELETE") {
            const { id } = JSON.parse(event.body);

            const result = await sql`
                DELETE FROM books WHERE id = ${id} AND user_id = ${user.id} RETURNING *
            `;

            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Book not found" }) };
            }

            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: "Book deleted" }) };
        }

        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
    } catch (error) {
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: error.message }) };
    }
};
