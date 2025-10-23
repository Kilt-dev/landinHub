const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cozeRoutes = require('./routes/coze');
const app = express();
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config();
const templateRoutes = require('./routes/templateRoutes');
const adminUserRoutes = require("./routes/adminUserRoutes");


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({ origin: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    credentials: true,}));



app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/images',  require('./routes/imageRoutes'))
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/payout', require('./routes/payout'));
app.use('/api/admin/marketplace', require('./routes/adminMarketplace'));
app.use("/api/admin/users", adminUserRoutes);

app.use('/api/coze', require('./routes/coze'));
module.exports = app;