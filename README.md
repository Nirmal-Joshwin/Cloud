# ExamVault - Decentralized Time-Locked Exam Paper Security System

A production-grade Web3 application combining **local AES-256 client-side encryption**, **decentralized IPFS storage**, and a **Solidity smart contract time-lock** to prevent exam paper leaks before the official start timestamp.

---

## 🔒 Security Architecture

1. **Local AES-256 Encryption (Examiner Browser)**:
   - When the examiner uploads an exam paper (PDF), a cryptographically random 256-bit key is generated locally using `CryptoJS`.
   - The file is converted and encrypted in-memory. Plaintext exam papers are **never** transmitted across the network or stored in any cloud server.

2. **Decentralized IPFS Storage**:
   - The encrypted ciphertext is uploaded to IPFS via the Pinata API (with automatic fallback to a local simulated IPFS store for zero-config development).
   - Tamper-proof content-addressed CID is recorded.

3. **Time-Locked Solidity Smart Contract (`ExamVault.sol`)**:
   - The examiner calls `createExam(examId, ipfsCID, unlockTime, aesKey, authorizedCenters)`.
   - The contract holds the AES key and only releases it via `getDecryptionKey(examId)` if:
     1. `block.timestamp >= unlockTime` (Time-lock has elapsed).
     2. `msg.sender` is in the authorized center whitelist.

4. **Exam Center Retrieval & Decryption**:
   - The exam center connects their MetaMask wallet and looks up the `examId`.
   - The encrypted paper is pre-fetched from IPFS.
   - At or after the scheduled exam time, the center calls `getDecryptionKey(examId)`.
   - The browser uses the retrieved AES-256 key to decrypt the ciphertext back into the original PDF and triggers an instant download.

---

## 🚀 Quickstart Guide

### 1. Compile Smart Contracts
```bash
npx hardhat compile
```

### 2. Run Automated Contract Tests
```bash
npx hardhat test
```

### 3. Start Local Hardhat Blockchain Node
Open a separate terminal:
```bash
npx hardhat node
```
This will start a local Ethereum network at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

### 4. Deploy ExamVault Contract
In another terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
This automatically updates `src/contracts/contract-address.json` and exports the contract ABI.

### 5. Start the Next.js Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Application

You have two ways to test the application:

### Option A: Zero-Setup Built-in Demo Accounts (Recommended for instant testing without MetaMask)
If you don't have the MetaMask extension installed in your current browser, ExamVault includes a **Built-in Demo Mode**:
1. Simply ensure `npx hardhat node` is running and the contract is deployed (`npx hardhat run scripts/deploy.js --network localhost`).
2. Open [http://localhost:3000](http://localhost:3000). The app will automatically activate **Hardhat Demo Mode**.
3. Use the **Account Switcher** in the top-right navbar or on the page to toggle between:
   - **Account #0**: Examiner (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
   - **Account #1**: Authorized Exam Center 1 (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
   - **Account #2**: Authorized Exam Center 2 (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`)
   - **Account #3**: Unauthorized Center (`0x90F79bf6EB2c4f870365E785982E1f101E93b906`)
4. Create an exam on the **Examiner Portal**, then switch to **Account #1** on the **Exam Center Portal** to test retrieving, time-locking, fast-forwarding, and decrypting the paper!

---

### Option B: Testing with MetaMask Extension

1. Install the [MetaMask extension](https://metamask.io/download/) in Chrome, Edge, Brave, or Firefox.
2. Add the Hardhat local network to MetaMask:
   - **Network Name**: Hardhat Localhost
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import the Hardhat test accounts into MetaMask using their private keys:
   - **Examiner Account (Account #0)**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - **Exam Center Account (Account #1)**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
4. Connect via MetaMask and interact with the portals as desired!


