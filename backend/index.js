const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pickingRoutes = require('./routes/pickingRoutes');

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000' })); 
app.use(express.json());

app.use('/api', pickingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});