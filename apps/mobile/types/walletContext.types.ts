export type WalletState = "loading" | "disconnected" | "connecting" | "connected" | "error";
export type WalletProviderKind = "freighter" | "walletconnect";

export interface WalletSignResult {
  signedTxXdr: string;
}

export interface WalletSubmitResult {
  hash?: string;
  txHash?: string;
}

export interface WalletKitAdapter {
  connect(network: { networkPassphrase: string; rpcUrl: string }): Promise<{ publicKey: string }>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(opts: { txXdr: string }): Promise<WalletSignResult>;
  signAndSubmitTransaction(opts: { txXdr: string; rpcUrl?: string }): Promise<WalletSubmitResult>;
}

export interface WalletContextValue {
  address: string | null;
  state: WalletState;
  provider: WalletProviderKind | null;
  connected: boolean;
  error: string | null;
  connect(provider?: WalletProviderKind): Promise<void>;
  disconnect(): Promise<void>;
  refresh(): void;
}