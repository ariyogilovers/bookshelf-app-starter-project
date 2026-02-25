const { neon } = require("@neondatabase/serverless");

exports.handler = async function (event, context) {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS books (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                year INTEGER NOT NULL,
                genre VARCHAR(100) DEFAULT '',
                franchise VARCHAR(100) DEFAULT '',
                is_complete BOOLEAN DEFAULT FALSE,
                user_id INTEGER REFERENCES users(id)
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS films (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                director VARCHAR(255) NOT NULL,
                year INTEGER NOT NULL,
                genre VARCHAR(100) DEFAULT '',
                franchise VARCHAR(100) DEFAULT '',
                is_complete BOOLEAN DEFAULT FALSE,
                user_id INTEGER REFERENCES users(id)
            )
        `;

        // Add columns if tables already exist without them
        await sql`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='user_id') THEN
                    ALTER TABLE books ADD COLUMN user_id INTEGER REFERENCES users(id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='films' AND column_name='user_id') THEN
                    ALTER TABLE films ADD COLUMN user_id INTEGER REFERENCES users(id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='genre') THEN
                    ALTER TABLE books ADD COLUMN genre VARCHAR(100) DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='franchise') THEN
                    ALTER TABLE books ADD COLUMN franchise VARCHAR(100) DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='films' AND column_name='genre') THEN
                    ALTER TABLE films ADD COLUMN genre VARCHAR(100) DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='films' AND column_name='franchise') THEN
                    ALTER TABLE films ADD COLUMN franchise VARCHAR(100) DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='completed_by') THEN
                    ALTER TABLE books ADD COLUMN completed_by VARCHAR(100) DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='films' AND column_name='completed_by') THEN
                    ALTER TABLE films ADD COLUMN completed_by VARCHAR(100) DEFAULT '';
                END IF;
            END $$
        `;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, message: "Tables users, books & films are ready" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
