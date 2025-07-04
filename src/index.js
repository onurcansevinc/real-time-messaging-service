const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // 10mb limit for json
app.use(express.urlencoded({ extended: true })); // extended: true for urlencoded

// Routes
app.use('/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
