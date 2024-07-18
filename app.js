const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'obituary_platform'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Handle form submission
app.post('/submit_obituary', (req, res) => {
    const { name, date_of_birth, date_of_death, content, author } = req.body;
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + new Date().getTime();

    const sql = 'INSERT INTO obituaries (name, date_of_birth, date_of_death, content, author, slug) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, date_of_birth, date_of_death, content, author, slug], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error submitting obituary');
        }
        res.send('Obituary submitted successfully');
    });
});

// Route to view obituaries
app.get('/view_obituaries', (req, res) => {
    const sql = 'SELECT * FROM obituaries';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving obituaries');
        }
        let html = '<h1>Obituaries</h1><table><tr><th>Name</th><th>Date of Birth</th><th>Date of Death</th><th>Content</th><th>Author</th><th>Submission Date</th></tr>';
        results.forEach(obituary => {
            html += `<tr><td>${obituary.name}</td><td>${obituary.date_of_birth}</td><td>${obituary.date_of_death}</td><td>${obituary.content}</td><td>${obituary.author}</td><td>${obituary.submission_date}</td></tr>`;
        });
        html += '</table>';
        res.send(html);
    });
});

// Route to view a single obituary
app.get('/view_obituary/:slug', (req, res) => {
    const slug = req.params.slug;
    const sql = 'SELECT * FROM obituaries WHERE slug = ?';
    db.query(sql, [slug], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving obituary');
        }
        if (results.length === 0) {
            return res.status(404).send('Obituary not found');
        }
        const obituary = results[0];
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${obituary.name}'s Obituary</title>
                <meta name="description" content="${obituary.content.substring(0, 150)}">
                <meta name="keywords" content="obituary, ${obituary.name}">
                <meta property="og:title" content="${obituary.name}'s Obituary">
                <meta property="og:description" content="${obituary.content.substring(0, 150)}">
                <meta property="og:type" content="article">
                <meta property="og:url" content="http://obituary.com/view_obituary/${obituary.slug}">
                <link rel="canonical" href="http://obituary.com/view_obituary/${obituary.slug}">
            </head>
            <body>
                <h1>${obituary.name}</h1>
                <p>Date of Birth: ${obituary.date_of_birth}</p>
                <p>Date of Death: ${obituary.date_of_death}</p>
                <p>${obituary.content}</p>
                <p>Author: ${obituary.author}</p>
                <p>Submission Date: ${obituary.submission_date}</p>
            </body>
            </html>
        `);
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
