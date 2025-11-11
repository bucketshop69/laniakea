import { Request, Response } from 'express';
import { KoraService } from '../services/KoraService';

export const getKoraSignerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const koraService = new KoraService();
    const signerAddress = await koraService.getKoraSignerPublicKey();

    res.json({
      signer_address: signerAddress
    });
  } catch (error) {
    console.error('Error in /get-kora-signer endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get Kora signer address'
    });
  }
};
