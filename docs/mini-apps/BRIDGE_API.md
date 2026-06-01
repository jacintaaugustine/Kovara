# Linkora Bridge API Reference

The bridge is the controlled interface between a mini app and the Linkora host. It is injected as `window.LinkoraSDK` when your app runs inside the Linkora mobile client.

Every method requires the matching permission string declared in `linkora-manifest.json`. Undeclared calls are rejected immediately with a `PermissionDenied` error — the wallet is never reached.

---

## Error Handling

All bridge methods return Promises. On failure they reject with a `BridgeError`:

```ts
class BridgeError extends Error {
  code: "PermissionDenied" | "UserRejected" | "MethodUnavailable";
}
```

| Code | When it occurs |
|---|---|
| `PermissionDenied` | The method is not listed in the manifest `permissions` array |
| `UserRejected` | The user declined the approval prompt (sign / signTransaction) |
| `MethodUnavailable` | The host does not support this method in the current version |

Always wrap bridge calls in `try/catch`:

```js
try {
  const address = await LinkoraSDK.wallet.getAddress();
} catch (err) {
  if (err.code === "PermissionDenied") { /* handle */ }
  if (err.code === "UserRejected")    { /* handle */ }
}
```

---

## `wallet.getAddress`

Returns the Stellar public key of the currently connected wallet.

**Permission required:** `wallet.getAddress`

**Signature:**
```ts
LinkoraSDK.wallet.getAddress(): Promise<string>
```

**Returns:** Stellar public key string (56-character G… address).

**Example:**
```js
const address = await LinkoraSDK.wallet.getAddress();
// "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
console.log("Connected:", address);
```

**Errors:**

| Code | Reason |
|---|---|
| `PermissionDenied` | `wallet.getAddress` not in manifest permissions |
| `MethodUnavailable` | No wallet connected in the host |

---

## `wallet.sign`

Signs an arbitrary string payload with the user's wallet. The host shows an approval prompt before signing.

**Permission required:** `wallet.sign`

**Signature:**
```ts
LinkoraSDK.wallet.sign(payload: string): Promise<{ signature: string }>
```

**Parameters:**

| Name | Type | Description |
|---|---|---|
| `payload` | `string` | The raw string to sign |

**Returns:**

```ts
{ signature: string }  // base64-encoded signature
```

**Example:**
```js
const { signature } = await LinkoraSDK.wallet.sign("linkora:auth:1234");
console.log("Signature:", signature);
```

**Errors:**

| Code | Reason |
|---|---|
| `PermissionDenied` | `wallet.sign` not in manifest permissions |
| `UserRejected` | User dismissed the approval prompt |

---

## `wallet.signTransaction`

Signs a Stellar XDR-encoded transaction. The host decodes and displays the transaction details to the user before prompting for approval.

**Permission required:** `wallet.signTransaction`

**Signature:**
```ts
LinkoraSDK.wallet.signTransaction(txXdr: string): Promise<{ signedTxXdr: string }>
```

**Parameters:**

| Name | Type | Description |
|---|---|---|
| `txXdr` | `string` | Base64-encoded Stellar transaction envelope XDR |

**Returns:**

```ts
{ signedTxXdr: string }  // base64-encoded signed transaction envelope XDR
```

**Example:**
```js
// Build txXdr using Stellar SDK or Horizon, then:
const { signedTxXdr } = await LinkoraSDK.wallet.signTransaction(txXdr);

// Submit to Horizon
await fetch("https://horizon-testnet.stellar.org/transactions", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ tx: signedTxXdr }),
});
```

**Errors:**

| Code | Reason |
|---|---|
| `PermissionDenied` | `wallet.signTransaction` not in manifest permissions |
| `UserRejected` | User dismissed the signing prompt |
| `MethodUnavailable` | Host wallet does not support XDR signing |

---

## `profile.get`

Returns the Linkora profile of the currently connected user.

**Permission required:** `profile.get`

**Signature:**
```ts
LinkoraSDK.profile.get(): Promise<LinkoraProfile>
```

**Returns:**

```ts
interface LinkoraProfile {
  address: string;           // Stellar public key
  username: string;          // Linkora username (3–32 chars, alphanumeric + _)
  creatorToken: CreatorToken | null;
}

interface CreatorToken {
  code: string;              // Asset code, e.g. "MAYA"
  issuer: string;            // Issuer Stellar address
}
```

**Example:**
```js
const profile = await LinkoraSDK.profile.get();
console.log("Username:", profile.username);
// "maya"

if (profile.creatorToken) {
  console.log("Token:", profile.creatorToken.code);
  // "MAYA"
}
```

**Errors:**

| Code | Reason |
|---|---|
| `PermissionDenied` | `profile.get` not in manifest permissions |
| `MethodUnavailable` | User has no Linkora profile yet |

---

## Full Permission List

| Permission string | Namespace | User prompt shown? |
|---|---|---|
| `wallet.getAddress` | wallet | No |
| `wallet.sign` | wallet | Yes — shows payload |
| `wallet.signTransaction` | wallet | Yes — shows decoded transaction |
| `profile.get` | profile | No |

---

## TypeScript Types

If you are building your mini app with TypeScript, copy this ambient declaration into your project:

```ts
interface LinkoraBridgeWallet {
  getAddress(): Promise<string>;
  sign(payload: string): Promise<{ signature: string }>;
  signTransaction(txXdr: string): Promise<{ signedTxXdr: string }>;
}

interface LinkoraBridgeProfile {
  get(): Promise<{
    address: string;
    username: string;
    creatorToken: { code: string; issuer: string } | null;
  }>;
}

interface LinkoraSDKType {
  wallet: LinkoraBridgeWallet;
  profile: LinkoraBridgeProfile;
}

declare global {
  interface Window {
    LinkoraSDK?: LinkoraSDKType;
  }
}
```

---

## Versioning

The bridge version is available at runtime:

```js
console.log(window.LinkoraSDK?.version);
// "1.0.0"
```

Use `minSdkVersion` in your manifest to declare the minimum bridge version your app requires. The host will refuse to load your app and show an upgrade prompt if the installed version is lower.
