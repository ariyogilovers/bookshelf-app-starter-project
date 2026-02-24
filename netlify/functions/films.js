const { neon } = require("@neondatabase/serverless");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
};

exports.handler = async function (event, context) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    try {
        // GET — list all films (optional ?search=)
        if (event.httpMethod === "GET") {
            const search = event.queryStringParameters?.search;
            let films;

            if (search) {
                films = await sql`
                    SELECT * FROM films
                    WHERE LOWER(title) LIKE ${'%' + search.toLowerCase() + '%'}
                    ORDER BY id DESC
                `;
            } else {
                films = await sql`SELECT * FROM films ORDER BY id DESC`;
            }

            const mapped = films.map(row => ({
                id: Number(row.id),
                title: row.title,
                director: row.director,
                year: row.year,
                isComplete: row.is_complete,
            }));

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify(mapped),
            };
        }

        // POST — add a new film
        if (event.httpMethod === "POST") {
            const { id, title, director, year, isComplete } = JSON.parse(event.body);

            const result = await sql`
                INSERT INTO films (id, title, director, year, is_complete)
                VALUES (${id}, ${title}, ${director}, ${year}, ${isComplete})
                RETURNING *
            `;

            const row = result[0];
            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id),
                    title: row.title,
                    director: row.director,
                    year: row.year,
                    isComplete: row.is_complete,
                }),
            };
        }

        // PUT — update a film
        if (event.httpMethod === "PUT") {
            const { id, title, director, year, isComplete } = JSON.parse(event.body);

            const result = await sql`
                UPDATE films
                SET title = ${title}, director = ${director}, year = ${year}, is_complete = ${isComplete}
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Film not found" }),
                };
            }

            const row = result[0];
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    id: Number(row.id),
                    title: row.title,
                    director: row.director,
                    year: row.year,
                    isComplete: row.is_complete,
                }),
            };
        }

        // DELETE — delete a film
        if (event.httpMethod === "DELETE") {
            const { id } = JSON.parse(event.body);

            const result = await sql`
                DELETE FROM films WHERE id = ${id} RETURNING *
            `;

            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Film not found" }),
                };
            }

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: "Film deleted successfully" }),
            };
        }

        return {
            statusCode: 405,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
