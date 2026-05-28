require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const profileRoutes = require('./src/routes/profileRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'GitHub Profile Analyzer API' });
});

app.use('/api/profiles', profileRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;