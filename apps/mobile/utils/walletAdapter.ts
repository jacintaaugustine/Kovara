export interface WalletAdapter {
  getPublicKey(): Promise<string>;
  isConnected(): Promise<boolean>;
  signTransaction(txXdr: string): Promise<string>;
  signAndSubmitTransaction(txXdr: string, rpcUrl: string): Promise<string>;
  disconnect(): Promise<void>;
}

export function getFreighterAdapter(): WalletAdapter {
  return {
    async getPublicKey() {
      const { getPublicKey } = await import("@stellar/freighter-api");
      const res = await getPublicKey();
      if (res.error) throw new Error(res.error.message);
      return res.publicKey;
    },
    async isConnected() {
      const { isConnected } = await import("@stellar/freighter-api");
      const res = await isConnected();
      return res.isConnected;
    },
    async signTransaction(txXdr: string) {
      const { signTransaction } = await import("@stellar/freighter-api");
      const res = await signTransaction(txXdr);
      if (res.error) throw new Error(res.error.message);
      return res.signedTxXdr;
    },
    async signAndSubmitTransaction(txXdr: string, rpcUrl: string) {
      const signed = await this.signTransaction(txXdr);
      const { rpc } = await import("@stellar/stellar-sdk");
      const server = new rpc.Server(rpcUrl);
      const res = await server.submitTransaction(signed);
      return res?.hash ?? "";
    },
    async disconnect() {
      // Freighter does not expose a disconnect API; caller clears local state
    },
  };
}