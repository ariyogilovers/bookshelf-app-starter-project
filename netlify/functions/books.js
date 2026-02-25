const { neon } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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
        // GET
        if (event.httpMethod === "GET") {
            const params = event.queryStringParameters || {};
            const search = params.search;
            const shared = params.shared === "true";

            let books;
            if (shared) {
                if (search) {
                    books = await sql`
                        SELECT b.*, u.name AS owner_name
                        FROM books b INNER JOIN users u ON b.user_id = u.id
                        WHERE LOWER(b.title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY b.id DESC
                    `;
                } else {
                    books = await sql`
                        SELECT b.*, u.name AS owner_name
                        FROM books b INNER JOIN users u ON b.user_id = u.id
                        ORDER BY b.id DESC
                    `;
                }
            } else {
                if (search) {
                    books = await sql`
                        SELECT * FROM books
                        WHERE user_id = ${user.id} AND LOWER(title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY id DESC
                    `;
                } else {
                    books = await sql`SELECT * FROM books WHERE user_id = ${user.id} ORDER BY id DESC`;
                }
            }

            const mapped = books.map(row => ({
                id: Number(row.id), title: row.title, author: row.author,
                year: row.year, genre: row.genre || '', franchise: row.franchise || '',
                isComplete: row.is_complete, userId: row.user_id, ownerName: row.owner_name || null,
                completedBy: row.completed_by || '',
            }));
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(mapped) };
        }

        // POST
        if (event.httpMethod === "POST") {
            const { id, title, author, year, genre, franchise, isComplete } = JSON.parse(event.body);
            const result = await sql`
                INSERT INTO books (id, title, author, year, genre, franchise, is_complete, user_id)
                VALUES (${id}, ${title}, ${author}, ${year}, ${genre || ''}, ${franchise || ''}, ${isComplete}, ${user.id})
                RETURNING *
            `;
            const row = result[0];
            return {
                statusCode: 201, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, author: row.author, year: row.year,
                    genre: row.genre || '', franchise: row.franchise || '',
                    isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // PUT
        if (event.httpMethod === "PUT") {
            const { id, title, author, year, genre, franchise, isComplete } = JSON.parse(event.body);
            // For personal PUT: add/remove own name from completed_by list
            const existing = await sql`SELECT completed_by FROM books WHERE id = ${id}`;
            let names = (existing[0]?.completed_by || '').split(',').map(n => n.trim()).filter(Boolean);
            if (isComplete && !names.includes(user.name)) {
                names.push(user.name);
            } else if (!isComplete) {
                names = names.filter(n => n !== user.name);
            }
            const completedBy = names.join(', ');
            const result = await sql`
                UPDATE books SET title = ${title}, author = ${author}, year = ${year},
                    genre = ${genre || ''}, franchise = ${franchise || ''}, is_complete = ${isComplete},
                    completed_by = ${completedBy}
                WHERE id = ${id} AND user_id = ${user.id} RETURNING *
            `;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Book not found" }) };
            }
            const row = result[0];
            return {
                statusCode: 200, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, author: row.author, year: row.year,
                    genre: row.genre || '', franchise: row.franchise || '',
                    isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // DELETE
        if (event.httpMethod === "DELETE") {
            const { id } = JSON.parse(event.body);
            const result = await sql`DELETE FROM books WHERE id = ${id} AND user_id = ${user.id} RETURNING *`;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Book not found" }) };
            }
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: "Book deleted" }) };
        }

        // PATCH - Family-wide toggle completion (any authenticated user can toggle)
        if (event.httpMethod === "PATCH") {
            const { id, isComplete } = JSON.parse(event.body);
            // Get existing completed_by list and add/remove current user
            const existing = await sql`SELECT completed_by FROM books WHERE id = ${id}`;
            let names = (existing[0]?.completed_by || '').split(',').map(n => n.trim()).filter(Boolean);
            if (isComplete && !names.includes(user.name)) {
                names.push(user.name);
            } else if (!isComplete) {
                names = names.filter(n => n !== user.name);
            }
            const completedBy = names.join(', ');
            const finalComplete = names.length > 0 ? true : isComplete;
            const result = await sql`
                UPDATE books SET is_complete = ${finalComplete}, completed_by = ${completedBy}
                WHERE id = ${id} RETURNING *
            `;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Book not found" }) };
            }
            const row = result[0];
            return {
                statusCode: 200, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, author: row.author, year: row.year,
                    genre: row.genre || '', franchise: row.franchise || '',
                    isComplete: row.is_complete, userId: row.user_id,
                    completedBy: row.completed_by || '',
                }),
            };
        }

        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
    } catch (error) {
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: error.message }) };
    }
};
