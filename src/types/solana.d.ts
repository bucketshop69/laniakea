// Define the type for the Solana wallet adapter on the window object
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey?: {
        toBytes(): Uint8Array;
        toString(): string;
      };
      // Add other properties as needed
      [key: string]: any;
    };
  }
}

export {};