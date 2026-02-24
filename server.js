const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (index.html, css/, main.js)
app.use(express.static(path.join(__dirname)));

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Auto-create tables on startup
async function initDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id BIGINT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        is_complete BOOLEAN DEFAULT FALSE
      );
    `);
        console.log('✅ Database table "books" is ready.');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS films (
        id BIGINT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        director VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        is_complete BOOLEAN DEFAULT FALSE
      );
    `);
        console.log('✅ Database table "films" is ready.');
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
    }
}

// ============================================
// BOOKS API Endpoints
// ============================================

// GET /api/books
app.get('/api/books', async (req, res) => {
    try {
        const { search } = req.query;
        let result;

        if (search) {
            result = await pool.query(
                'SELECT * FROM books WHERE LOWER(title) LIKE $1 ORDER BY id DESC',
                [`%${search.toLowerCase()}%`]
            );
        } else {
            result = await pool.query('SELECT * FROM books ORDER BY id DESC');
        }

        const books = result.rows.map((row) => ({
            id: Number(row.id),
            title: row.title,
            author: row.author,
            year: row.year,
            isComplete: row.is_complete,
        }));

        res.json(books);
    } catch (err) {
        console.error('Error fetching books:', err.message);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// POST /api/books
app.post('/api/books', async (req, res) => {
    try {
        const { id, title, author, year, isComplete } = req.body;

        const result = await pool.query(
            'INSERT INTO books (id, title, author, year, is_complete) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, title, author, year, isComplete]
        );

        const row = result.rows[0];
        res.status(201).json({
            id: Number(row.id),
            title: row.title,
            author: row.author,
            year: row.year,
            isComplete: row.is_complete,
        });
    } catch (err) {
        console.error('Error adding book:', err.message);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// PUT /api/books/:id
app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, year, isComplete } = req.body;

        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, year = $3, is_complete = $4 WHERE id = $5 RETURNING *',
            [title, author, year, isComplete, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const row = result.rows[0];
        res.json({
            id: Number(row.id),
            title: row.title,
            author: row.author,
            year: row.year,
            isComplete: row.is_complete,
        });
    } catch (err) {
        console.error('Error updating book:', err.message);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// DELETE /api/books/:id
app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM books WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error('Error deleting book:', err.message);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// ============================================
// FILMS API Endpoints
// ============================================

// GET /api/films
app.get('/api/films', async (req, res) => {
    try {
        const { search } = req.query;
        let result;

        if (search) {
            result = await pool.query(
                'SELECT * FROM films WHERE LOWER(title) LIKE $1 ORDER BY id DESC',
                [`%${search.toLowerCase()}%`]
            );
        } else {
            result = await pool.query('SELECT * FROM films ORDER BY id DESC');
        }

        const films = result.rows.map((row) => ({
            id: Number(row.id),
            title: row.title,
            director: row.director,
            year: row.year,
            isComplete: row.is_complete,
        }));

        res.json(films);
    } catch (err) {
        console.error('Error fetching films:', err.message);
        res.status(500).json({ error: 'Failed to fetch films' });
    }
});

// POST /api/films
app.post('/api/films', async (req, res) => {
    try {
        const { id, title, director, year, isComplete } = req.body;

        const result = await pool.query(
            'INSERT INTO films (id, title, director, year, is_complete) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, title, director, year, isComplete]
        );

        const row = result.rows[0];
        res.status(201).json({
            id: Number(row.id),
            title: row.title,
            director: row.director,
            year: row.year,
            isComplete: row.is_complete,
        });
    } catch (err) {
        console.error('Error adding film:', err.message);
        res.status(500).json({ error: 'Failed to add film' });
    }
});

// PUT /api/films/:id
app.put('/api/films/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, director, year, isComplete } = req.body;

        const result = await pool.query(
            'UPDATE films SET title = $1, director = $2, year = $3, is_complete = $4 WHERE id = $5 RETURNING *',
            [title, director, year, isComplete, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Film not found' });
        }

        const row = result.rows[0];
        res.json({
            id: Number(row.id),
            title: row.title,
            director: row.director,
            year: row.year,
            isComplete: row.is_complete,
        });
    } catch (err) {
        console.error('Error updating film:', err.message);
        res.status(500).json({ error: 'Failed to update film' });
    }
});

// DELETE /api/films/:id
app.delete('/api/films/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM films WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Film not found' });
        }

        res.json({ message: 'Film deleted successfully' });
    } catch (err) {
        console.error('Error deleting film:', err.message);
        res.status(500).json({ error: 'Failed to delete film' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    await initDatabase();
});
