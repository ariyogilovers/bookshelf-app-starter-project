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

            let films;
            if (shared) {
                if (search) {
                    films = await sql`
                        SELECT f.*, u.name AS owner_name
                        FROM films f INNER JOIN users u ON f.user_id = u.id
                        WHERE LOWER(f.title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY f.id DESC
                    `;
                } else {
                    films = await sql`
                        SELECT f.*, u.name AS owner_name
                        FROM films f INNER JOIN users u ON f.user_id = u.id
                        ORDER BY f.id DESC
                    `;
                }
            } else {
                if (search) {
                    films = await sql`
                        SELECT * FROM films
                        WHERE user_id = ${user.id} AND LOWER(title) LIKE ${'%' + search.toLowerCase() + '%'}
                        ORDER BY id DESC
                    `;
                } else {
                    films = await sql`SELECT * FROM films WHERE user_id = ${user.id} ORDER BY id DESC`;
                }
            }

            const mapped = films.map(row => ({
                id: Number(row.id), title: row.title, director: row.director,
                year: row.year, genre: row.genre || '', franchise: row.franchise || '',
                isComplete: row.is_complete, userId: row.user_id, ownerName: row.owner_name || null,
                completedBy: row.completed_by || '',
            }));
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(mapped) };
        }

        // POST
        if (event.httpMethod === "POST") {
            const { id, title, director, year, genre, franchise, isComplete } = JSON.parse(event.body);
            const result = await sql`
                INSERT INTO films (id, title, director, year, genre, franchise, is_complete, user_id)
                VALUES (${id}, ${title}, ${director}, ${year}, ${genre || ''}, ${franchise || ''}, ${isComplete}, ${user.id})
                RETURNING *
            `;
            const row = result[0];
            return {
                statusCode: 201, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, director: row.director, year: row.year,
                    genre: row.genre || '', franchise: row.franchise || '',
                    isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // PUT
        if (event.httpMethod === "PUT") {
            const { id, title, director, year, genre, franchise, isComplete } = JSON.parse(event.body);
            const result = await sql`
                UPDATE films SET title = ${title}, director = ${director}, year = ${year},
                    genre = ${genre || ''}, franchise = ${franchise || ''}, is_complete = ${isComplete}
                WHERE id = ${id} AND user_id = ${user.id} RETURNING *
            `;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Film not found" }) };
            }
            const row = result[0];
            return {
                statusCode: 200, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, director: row.director, year: row.year,
                    genre: row.genre || '', franchise: row.franchise || '',
                    isComplete: row.is_complete, userId: row.user_id,
                }),
            };
        }

        // DELETE
        if (event.httpMethod === "DELETE") {
            const { id } = JSON.parse(event.body);
            const result = await sql`DELETE FROM films WHERE id = ${id} AND user_id = ${user.id} RETURNING *`;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Film not found" }) };
            }
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: "Film deleted" }) };
        }

        // PATCH - Family-wide toggle completion (any authenticated user can toggle)
        if (event.httpMethod === "PATCH") {
            const { id, isComplete } = JSON.parse(event.body);
            const completedBy = isComplete ? user.name : '';
            const result = await sql`
                UPDATE films SET is_complete = ${isComplete}, completed_by = ${completedBy}
                WHERE id = ${id} RETURNING *
            `;
            if (result.length === 0) {
                return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Film not found" }) };
            }
            const row = result[0];
            return {
                statusCode: 200, headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id), title: row.title, director: row.director, year: row.year,
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
