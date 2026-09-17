# ExamVault: Decentralized Time-Locked Exam Paper Security System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0)](https://docs.ethers.org/v6/)
[![IPFS / Pinata](https://img.shields.io/badge/IPFS-Pinata_Cloud-65c5c6?logo=ipfs)](https://pinata.cloud/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-fff100?logo=ethereum)](https://hardhat.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia_Testnet-blue)](https://sepolia.etherscan.io/)

---

## 📖 1. Project Description

**ExamVault** is a zero-trust, decentralized exam paper distribution system engineered to prevent question paper leaks before the official examination start time.

Traditional examination pipelines store test papers on centralized cloud servers or email them to exam centers hours in advance, creating severe single-points-of-failure and vulnerability to unauthorized leaks. 

ExamVault solves this with a 3-pillar security model:
1. **Local Client-Side AES-256 Encryption**: Exam question papers (PDFs) are encrypted directly inside the examiner's browser using a randomly generated 256-bit cryptographic key. Unencrypted exam papers **never** touch any web server or network socket.
2. **Decentralized IPFS Storage**: Only the encrypted ciphertext is pinned to IPFS (via Pinata), producing a tamper-proof content-addressed CID.
3. **Solidity Time-Locked Smart Contract (`ExamVault.sol`)**: The AES decryption key is locked in an immutable Ethereum smart contract. The contract enforces strict access-control modifiers (`onlyAuthorized` and `onlyUnlocked`) that make it mathematically impossible for anyone—including contract owners and administrators—to extract the decryption key before the exact blockchain unlock timestamp arrives.

Once the exam window commences, whitelisted exam centers connect their Web3 wallets to retrieve the key, decrypt the paper in browser memory, and download the original PDF for printing.

---

## 🛠️ 2. Technologies and Tools Used

| Layer / Domain | Technology / Tool | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router) | `14.2.15` | Server-rendered & client React application architecture |
| **UI Styling** | [Tailwind CSS](https://tailwindcss.com/) | `3.4.14` | Dark cyber aesthetic, responsive layouts & glassmorphism |
| **UI Components & Icons** | [Lucide React](https://lucide.dev/) | `0.453.0` | Sleek vector icons and visual progress indicators |
| **File Uploading** | [React Dropzone](https://react-dropzone.js.org/) | `14.3.5` | Drag-and-drop client file upload handler |
| **Smart Contract Language** | [Solidity](https://soliditylang.org/) | `0.8.24` | Time-locked vault contract logic and access control modifiers |
| **Blockchain Dev Framework** | [Hardhat](https://hardhat.org/) | `2.22.14` | Compilation, automated unit testing & local node simulation |
| **Web3 Client Library** | [Ethers.js](https://docs.ethers.org/v6/) | `6.13.4` | Wallet connection (MetaMask/RPC), contract interaction & typing |
| **Cryptography** | [CryptoJS](https://cryptojs.gitbook.io/) | `4.2.0` | 256-bit AES client encryption/decryption of binary PDF data |
| **Decentralized Storage** | [Pinata Cloud](https://pinata.cloud/) / IPFS | API v3 | Pinning encrypted exam paper payloads with fallback simulation |
| **Cloud Hosting Platform** | [Render](https://render.com/) | Cloud | Production hosting of Next.js web application via `render.yaml` |
| **Blockchain Networks** | Ethereum Sepolia / Hardhat Local | 11155111 / 31337 | Public testnet and local EVM testing environments |

---

## 📦 3. Steps to Install Dependencies and Run the Project

### Prerequisites
* [Node.js](https://nodejs.org/) `>= 18.18.0` or `>= 20.0.0`
* [Git](https://git-scm.com/)
* *(Optional)* [MetaMask Extension](https://metamask.io/download/) installed in your browser.

---

### Step-by-Step Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Nirmal-Joshwin/Cloud.git
cd Cloud
```

#### 2. Install Project Dependencies
```bash
npm install
```

#### 3. Compile Smart Contracts
```bash
npx hardhat compile
```

#### 4. Run Automated Unit Tests
```bash
npx hardhat test
```
*Executes all 9 unit tests verifying access control, duplicate prevention, and time-lock enforcement.*

#### 5. Start the Local Blockchain Node
Open a **new terminal tab** and run:
```bash
npx hardhat node
```
*Spins up a local Ethereum network at `http://127.0.0.1:8545` with 20 pre-funded test accounts (10,000 ETH each).*

#### 6. Deploy the Contract Locally
In your original terminal tab, run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
*Deploys `ExamVault.sol` and automatically exports the contract address and ABI to `src/contracts/`.*

#### 7. Start the Next.js Web Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📂 4. Project Structure and Modules

```
├── contracts/
│   └── ExamVault.sol                 # Core Solidity smart contract managing vault records & time-locks
├── scripts/
│   └── deploy.js                     # Deployment script exporting contract address & ABI to frontend
├── test/
│   └── ExamVault.test.js             # Automated Mocha/Chai test suite testing all contract constraints
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Home landing page showcasing 3-pillar security architecture
│   │   ├── examiner/
│   │   │   └── page.tsx              # Examiner Portal: PDF upload, AES encryption, IPFS pinning, vaulting
│   │   ├── exam-center/
│   │   │   └── page.tsx              # Exam Center Portal: Search, live countdown, unlock, in-browser decryption
│   │   ├── layout.tsx                # Root HTML layout with Navbar & Footer
│   │   ├── globals.css               # Global Tailwind CSS styling & glassmorphism utilities
│   │   └── api/ipfs/
│   │       ├── upload/route.ts       # Serverless API route uploading ciphertext to Pinata IPFS
│   │       └── retrieve/route.ts     # Serverless API route fetching ciphertext from IPFS gateways
│   ├── components/
│   │   └── Navbar.tsx                # Responsive header, network badge, MetaMask & demo account switcher
│   ├── contracts/
│   │   ├── ExamVault.json            # Compiled contract ABI & bytecode consumed by Ethers.js
│   │   └── contract-address.json     # Configuration file storing active contract address
│   └── lib/
│       ├── contract.ts               # Ethers.js v6 helper: wallet connection, contract calls, EVM time warp
│       ├── crypto.ts                 # Cryptographic engine: AES-256 key generation, encrypt & decrypt to Blob
│       └── ipfs.ts                   # Client-side utility communicating with IPFS upload/retrieve endpoints
├── sample_exam.pdf                   # Test PDF exam document provided for demonstration
├── hardhat.config.js                 # Hardhat configuration for Localhost (31337) and Sepolia (11155111)
├── render.yaml                       # Infrastructure-as-code blueprint for Render cloud deployment
├── package.json                      # Project metadata, dependencies, and execution scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── .gitignore                        # Git exclusion rules preventing node_modules & secrets from committing
```

### Module Responsibilities:
* **`ExamVault.sol`**: Maintains the `exams` struct mapping and `isAuthorizedCenter` whitelist. Houses the `createExam()` mutator and `getDecryptionKey()` view getter guarded by `onlyAuthorized` and `onlyUnlocked` modifiers.
* **`src/lib/crypto.ts`**: Handles cryptographic operations purely in browser RAM. `encryptFile()` converts files to Base64 and AES-256 ciphertext; `decryptToBlob()` converts decrypted ciphertext back into an `application/pdf` binary Blob.
* **`src/lib/contract.ts`**: Abstracts Web3 interactions. Seamlessly switches between injected MetaMask providers and Hardhat JSON-RPC demo accounts, allowing testing with or without browser extensions.
* **`src/app/examiner/page.tsx`**: Provides examiners with drag-and-drop PDF uploads, random key generation, date/time scheduling with `+10m`/`+30m` presets, center address whitelisting, and contract deployment.
* **`src/app/exam-center/page.tsx`**: Provides exam centers with real-time countdown visualizers, authorization verification, IPFS pre-fetching, and local decryption with auto-triggered downloads.

---

## 📊 5. Sample Input and Output

### Scenario 1: Examiner Encrypting & Vaulting an Exam Paper

#### Input:
* **Uploaded File**: `sample_exam.pdf` (Size: `1.0 KB`, Type: `application/pdf`)
* **Exam ID (Numerical)**: `101`
* **Generated AES-256 Key**: `4333205e9b40ff065564f5fc7a6bc5deb241677de96062194a8d251dc8d01509`
* **Scheduled Unlock Time**: `17/09/2026, 22:00:00` (UNIX timestamp: `1789662600`)
* **Authorized Exam Centers**:
  - `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Center #1)
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Center #2)

#### Output (Examiner Portal):
```json
{
  "status": "Exam Vaulted Successfully!",
  "examId": "101",
  "ipfsCID": "QmLocal56dca2942ff20b87ca1774f64961eab8ddafc3a6",
  "storageProvider": "Pinata IPFS / Simulated Local Node",
  "unlockTimestamp": "17/09/2026, 22:00:00",
  "transactionHash": "0x8c22caa0dd7c283b741893abf80c15d769445366348becf4d1f2e115a182905b",
  "onChainEvent": "ExamCreated(examId=101, unlockTime=1789662600, centerCount=2)"
}
```

---

### Scenario 2: Exam Center Querying Before the Unlock Window (Active Time-Lock)

#### Input:
* **Connected Wallet**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Authorized Center #1)
* **Exam ID**: `101`
* **Current Blockchain Time**: `17/09/2026, 21:45:00` (15 minutes prior to unlock)

#### Output (Exam Center Portal):
* **Center Authorization Badge**: `✅ Whitelisted Center`
* **Time-Lock Status**: `🔒 Time-Locked`
* **Live Countdown**: `00:15:00` (Ticking down in real-time)
* **Action Button**: Disabled (`Paper is Time-Locked (Wait for Countdown)`)
* **Smart Contract Call Response**:
  ```text
  reverted with: "Access Denied: Exam paper is still time-locked. Unlock time has not arrived yet"
  ```

---

### Scenario 3: Unauthorized Center Attempting Access

#### Input:
* **Connected Wallet**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Unauthorized Center #3)
* **Exam ID**: `101`

#### Output:
* **Center Authorization Badge**: `❌ Not Whitelisted`
* **Error Banner**:
  ```text
  "The connected wallet is not whitelisted for this exam. Key retrieval will be denied by the contract."
  ```
* **Smart Contract Call Response**:
  ```text
  reverted with: "Access Denied: Caller is not an authorized exam center or examiner"
  ```

---

### Scenario 4: Successful Unlock and Decryption at Exam Start Time

#### Input:
* **Connected Wallet**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Authorized Center #1)
* **Exam ID**: `101`
* **Current Blockchain Time**: `17/09/2026, 22:00:01` (Unlock timestamp reached)
* **User Action**: Click **"Unlock Paper & Download PDF"**

#### Output:
1. **Contract Response**:
   `getDecryptionKey(101)` returns string:
   `"4333205e9b40ff065564f5fc7a6bc5deb241677de96062194a8d251dc8d01509"`
2. **Client Decryption Engine**:
   - Fetches ciphertext from IPFS CID `QmLocal56dca2...`
   - Decrypts ciphertext in browser RAM using CryptoJS AES
   - Reconstructs binary PDF buffer (`application/pdf`)
3. **Browser Output**:
   - Status Banner: `✅ Decryption Succeeded & Download Triggered!`
   - Automatic File Download: **`Exam_101_Paper.pdf`** (1.0 KB, byte-for-byte identical to original exam paper).

---

## 🌐 6. Live Deployment & Production Hosting

* **Live dApp URL**: [https://examvault-c2p1.onrender.com](https://examvault-c2p1.onrender.com)
* **Verified Contract Address (Sepolia Testnet)**:
  ```text
  0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3
  ```
* **Sepolia Etherscan**: [View Contract On-Chain](https://sepolia.etherscan.io/address/0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3)

### Render Hosting Environment Configuration
To host this project on Render, connect your GitHub repository and define the following environment variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20.17.0` | Node.js runtime version |
| `NPM_CONFIG_PRODUCTION` | `false` | Ensures build packages (Tailwind, TypeScript) install during deploy |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3` | Deployed ExamVault contract address on Sepolia |
| `NEXT_PUBLIC_GATEWAY_URL` | `https://gateway.pinata.cloud/ipfs/` | IPFS retrieval gateway |
| `NEXT_PUBLIC_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | Public Ethereum Sepolia JSON-RPC endpoint |
| `PINATA_JWT` | *(Optional)* Your Pinata JWT | For public IPFS pinning (falls back to simulation if omitted) |

---

## 🧪 7. Automated Test Suite

Run the full automated test suite using Hardhat:
```bash
npx hardhat test
```

### Test Suite Specifications:
1. **Exam Creation**: Verifies that valid exams are created with correctly mapped CIDs, unlock times, and center counts.
2. **Duplicate Protection**: Asserts that `createExam()` reverts if called with an existing `examId`.
3. **Timestamp Validation**: Asserts that `createExam()` reverts if `unlockTime <= block.timestamp`.
4. **Whitelist Enforcement**: Asserts that at least one authorized center address must be provided.
5. **Premature Access Rejection**: Asserts that authorized centers cannot retrieve the key before `unlockTime`.
6. **Unauthorized Account Rejection**: Asserts that non-whitelisted callers are rejected before and after `unlockTime`.
7. **Successful Key Release**: Asserts that advancing blockchain time past `unlockTime` releases the correct AES key to whitelisted centers.
8. **Examiner Access**: Asserts that the examiner can also retrieve the decryption key once unlocked.

---

## 📄 License

This project is licensed under the **MIT License**.
