import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4021;

app.use(cors());
app.use(express.json());

// Simple hello world endpoint to verify setup
app.get('/', (req, res) => {
  res.json({ message: 'API server running!' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});