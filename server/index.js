const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const multer = require('multer');
dotenv.config({ quiet: true });
const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

connectDB();

const app = express();

const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// This must be BEFORE any other routes/middleware
app.use('/cms-portfolio', createProxyMiddleware({
    target: 'http://127.0.0.1:80',
    changeOrigin: false,
    pathRewrite: { '^/cms-portfolio': '/cms-portfolio' },
    headers: {
        Host: 'scholarch.site'
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/users', require('./routes/user.js'));
app.use('/api/proposals', require('./routes/proposal.js'));

app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/html')));


app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large.' });
        }
        return res.status(400).json({ message: err.field });
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

if (process.env.NODE_ENV === 'production') {
    module.exports = app;
} else {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}