'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

function createServer() {
  return http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      const formPath = path.join(__dirname, 'form.html');

      fs.readFile(formPath, (err, data) => {
        if (err) {
          res.writeHead(500);

          return res.end('Error loading form');
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    } else if (req.method === 'POST' && req.url === '/submit-expense') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        let data;

        try {
          data = JSON.parse(body);
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });

          return res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }

        if (!data.date || !data.title || !data.amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });

          return res.end(JSON.stringify({ error: 'Missing required fields' }));
        }

        const expense = {
          date: data.date,
          title: data.title,
          amount: parseFloat(data.amount),
        };

        const dbPath = path.join(__dirname, '../db/expense.json');

        fs.readFile(dbPath, 'utf8', (err, fileData) => {
          let expenses = [];

          if (!err && fileData) {
            try {
              const parsed = JSON.parse(fileData);

              expenses = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              expenses = [];
            }
          }

          expenses.push(expense);

          fs.writeFile(dbPath, JSON.stringify(expenses, null, 2), (errr) => {
            if (errr) {
              res.writeHead(500);

              return res.end('⚠️ Failed to save data');
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(expense));
          });
        });
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });
}

module.exports = {
  createServer,
};
