import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supportedController } from './controllers/supportedController';
import { verifyController } from './controllers/verifyController';
import { settleController } from './controllers/settleController';
import { getPaymentInstructionController } from './controllers/getPaymentInstructionController';
import { getKoraSignerController } from './controllers/getKoraSignerController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple hello world endpoint to verify setup
app.get('/', (req, res) => {
  res.json({ message: 'Facilitator service running!' });
});

// x402 endpoints
app.get('/supported', supportedController);
app.post('/verify', verifyController);
app.post('/settle', settleController);
app.post('/get-payment-instruction', getPaymentInstructionController);
app.get('/get-kora-signer', getKoraSignerController);

app.listen(PORT, () => {
  console.log(`Facilitator service running on port ${PORT}`);
});