# 🛡️ ExamVault — Decentralized Time-Locked Exam Paper Security System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0)](https://docs.ethers.org/v6/)
[![IPFS / Pinata](https://img.shields.io/badge/IPFS-Pinata_Cloud-65c5c6?logo=ipfs)](https://pinata.cloud/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-fff100?logo=ethereum)](https://hardhat.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia_Testnet-blue)](https://sepolia.etherscan.io/)

A zero-trust Web3 application that eliminates single-point-of-failure exam paper leaks through **client-side AES-256 encryption**, **IPFS decentralized storage**, and an **immutable Solidity time-locked smart contract**.

---

## 📍 Live Deployment

* **Live Web App**: [https://examvault-c2p1.onrender.com](https://examvault-c2p1.onrender.com)
* **Deployed Smart Contract (Ethereum Sepolia Testnet)**:
  ```text
  0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3
  ```
* **Etherscan Sepolia Explorer**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3)

---

## 🔒 3-Layer Security Architecture

```
[ Examiner's Browser ]
       │
       ├─ 1. Upload Question Paper (PDF) via React Dropzone
       ├─ 2. Generate Random 256-bit AES Key locally in memory (CryptoJS)
       ├─ 3. Encrypt PDF to Ciphertext in-memory (Plaintext NEVER leaves browser)
       ├─ 4. Upload Ciphertext to IPFS (via Pinata API) -> Receive content-addressed CID
       ├─ 5. Pick Exam Start Date & Time -> UNIX Timestamp
       ├─ 6. Whitelist Authorized Exam Center Wallet Addresses
       └─ 7. Execute `createExam()` on ExamVault.sol
                                        │
                                        ▼
                   [ Ethereum Smart Contract: ExamVault.sol ]
                   - State: exams[examId] = { ipfsCID, unlockTime, aesKey, examiner }
                   - Access Control: isAuthorizedCenter[examId][address] = true
                   - Time-Lock Rule: require(block.timestamp >= unlockTime)
                                        │
[ Exam Center's Browser ]              │
       │                                │
       ├─ 1. Connect Authorized MetaMask Wallet (or Demo Account)
       ├─ 2. Search Exam ID -> Fetch Metadata & verify whitelist status
       ├─ 3. Download encrypted ciphertext ahead of time from IPFS Gateway
       ├─ 4. Live Countdown: Smart contract strictly rejects calls before unlockTime
       ├─ 5. At Exam Start Time: Call `getDecryptionKey(examId)` (view / staticCall)
       ├─ 6. Receive AES Key -> Decrypt ciphertext locally back to PDF Blob
       └─ 7. Automatic browser download triggers for printing / distribution
```

### Why This Design Prevents Leaks:
1. **Zero-Knowledge Cloud**: The server and IPFS never see or store the unencrypted exam paper. Even if an attacker compromises the IPFS storage or intercepts the network payload, they only obtain an unbroken AES-256 ciphertext.
2. **Cryptographic Time-Lock**: The AES decryption key is held inside the smart contract and released **only** when the blockchain timestamp reaches `unlockTime`.
3. **Strict Access Control**: Even after the unlock timestamp elapses, the smart contract will only release the key if `msg.sender` is in the authorized center whitelist or is the examiner.
4. **Local In-Memory Decryption**: The exam paper is decrypted entirely in the exam center browser's client memory, eliminating intermediate file leaks on centralized web servers.

---

## 💻 Tech Stack

* **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, React Dropzone.
* **Cryptography**: CryptoJS (AES-256 with 256-bit keys, UTF-8/Base64 transformations).
* **Decentralized Storage**: Pinata Cloud API (IPFS pinning with built-in simulated storage fallback for offline/demo mode).
* **Blockchain & Smart Contract**:
  - **Language**: Solidity `^0.8.24`
  - **Client Library**: Ethers.js `v6.13.4`
  - **Development Framework**: Hardhat `^2.22.14`
* **Cloud Hosting**: Render (Web Service via `render.yaml`).

---

## 📁 Repository Structure

```
├── contracts/
│   └── ExamVault.sol              # Solidity time-lock & whitelist smart contract
├── scripts/
│   └── deploy.js                  # Deployment script for Localhost / Sepolia
├── test/
│   └── ExamVault.test.js          # Complete Hardhat unit test suite (9 tests)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page & security overview
│   │   ├── examiner/page.tsx      # Examiner Portal (Upload, encrypt, schedule, deploy)
│   │   ├── exam-center/page.tsx   # Exam Center Portal (Verify, countdown, unlock, download)
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Dark cyber theme & glassmorphism styles
│   │   └── api/ipfs/
│   │       ├── upload/route.ts    # Next.js API route for Pinata IPFS uploads
│   │       └── retrieve/route.ts  # Next.js API route for IPFS fetching / fallback
│   ├── components/
│   │   └── Navbar.tsx             # Navigation, network badge & demo account switcher
│   ├── contracts/
│   │   ├── ExamVault.json         # Compiled contract ABI & bytecode
│   │   └── contract-address.json  # Auto-updated deployed contract addresses
│   └── lib/
│       ├── contract.ts            # Ethers v6 helpers, multi-network & dual-mode wallet
│       ├── crypto.ts              # AES-256 encryption, decryption, PDF Blob generator
│       └── ipfs.ts                # Client-side IPFS upload/fetch wrapper
├── sample_exam.pdf                # Pre-built test PDF for immediate testing
├── hardhat.config.js              # Hardhat configuration (Localhost & Sepolia networks)
├── render.yaml                    # Render blueprint deployment configuration
├── package.json                   # Dependencies & build scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## ⚙️ Prerequisites

* [Node.js](https://nodejs.org/) `>= 18.18.0` or `>= 20.0.0`
* [Git](https://git-scm.com/)
* *(Optional for public testnet)* [MetaMask](https://metamask.io/download/) browser extension with free SepoliaETH.

---

## 🚀 Running Locally

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/Nirmal-Joshwin/Cloud.git
cd Cloud
npm install
```

### Step 2: Compile the Smart Contract
```bash
npx hardhat compile
```

### Step 3: Run the Automated Unit Tests
```bash
npx hardhat test
```
**Test Coverage Output (9 Passing)**:
```
  ExamVault Smart Contract
    Exam Creation
      √ should allow examiner to create an exam with authorized centers
      √ should revert if creating with duplicate examId
      √ should revert if unlockTime is not in the future
      √ should revert if no authorized centers are provided
    Access Control & Time Lock Enforcement
      √ should revert if an authorized center calls before unlock time
      √ should revert if an unauthorized account calls before unlock time
      √ should revert if an unauthorized account calls AFTER unlock time
      √ should return the decryption key to an authorized center AFTER unlock time
      √ should also allow the examiner to retrieve the key after unlock time

  9 passing (679ms)
```

### Step 4: Start the Local Hardhat Blockchain Node
Open a new terminal tab:
```bash
npx hardhat node
```
*This spins up a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts (10,000 ETH each).*

### Step 5: Deploy the Contract to Local Node
In another terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
*This exports the deployed address and ABI directly to `src/contracts/` for the Next.js frontend.*

### Step 6: Start the Next.js Web App
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🧪 Testing Methods

### Option A: Built-in Demo Mode (Zero Extensions Needed)
If you don't have MetaMask installed, ExamVault includes **automatic Hardhat Demo Mode**:
1. With `npx hardhat node` running, simply open [http://localhost:3000](http://localhost:3000).
2. Use the **Account Switcher** dropdown in the top-right navbar to switch between:
   - **Account #0 (Examiner)**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - **Account #1 (Authorized Center 1)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Account #2 (Authorized Center 2)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - **Account #3 (Unauthorized Account)**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
3. On the Examiner Portal, upload `sample_exam.pdf`, click **"Use Hardhat Test Wallets"**, and lock the paper.
4. On the Exam Center Portal, look up the Exam ID. Notice the **Time-Locked** status.
5. Click **"+15 Mins"** on the EVM Fast-Forward control to instantly advance blockchain time without waiting!
6. Click **"Unlock Paper & Download PDF"** — the paper decrypts and downloads immediately.

---

### Option B: Testing on Ethereum Sepolia Testnet (Public Web3)

1. **Switch MetaMask to Sepolia**:
   - Open MetaMask $\rightarrow$ Click network dropdown $\rightarrow$ Toggle **"Show test networks"** $\rightarrow$ Select **Sepolia**.
2. **Get Free SepoliaETH**:
   - Get 0.05 Sepolia ETH from [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia Faucet](https://sepoliafaucet.com/).
3. **Deploying the Contract**:
   - **Method 1 (In-Browser)**: Visit `/examiner` on your live site, and under *Smart Contract Target*, click **"Deploy ExamVault Contract to Sepolia"**. Confirm the transaction in MetaMask!
   - **Method 2 (CLI)**: Put your private key in `.env.local` (`PRIVATE_KEY=0x...`) and run:
     ```bash
     npm run deploy:sepolia
     ```
4. **Publish Exam as Examiner**:
   - Upload your exam PDF.
   - Choose a preset unlock time (e.g. `+10m` or `+30m`).
   - Add the exam center's Ethereum wallet address to the whitelist.
   - Click **"Lock & Publish Exam to Vault"** and confirm in MetaMask.
5. **Retrieve as Exam Center**:
   - Switch MetaMask to the authorized center's wallet.
   - Visit `/exam-center` and enter the Exam ID.
   - Wait for the countdown to reach `00:00:00` (or set a short unlock window during testing).
   - Click **"Unlock Paper & Download PDF"**!

---

## 🌐 Deploying to Render

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/Joshwin/Documents/Cloud/render.yaml) blueprint.

### 1-Click Blueprint Deployment:
1. Push your repository to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com/) $\rightarrow$ Click **New +** $\rightarrow$ **Blueprint**.
3. Select your repository (`Nirmal-Joshwin/Cloud`).
4. Render will read `render.yaml` and configure the service automatically.
5. Provide the Environment Variables:
   - `NODE_VERSION`: `20.17.0`
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3` (or your deployed contract)
   - `NEXT_PUBLIC_RPC_URL`: `https://ethereum-sepolia-rpc.publicnode.com`
   - `PINATA_JWT`: *(Optional)* Your Pinata JWT (enter `mock` if you don't have one)
6. Click **Apply**. Your app will build and go live within 2 minutes!

---

## 📜 Smart Contract Specification (`ExamVault.sol`)

### Core Struct
```solidity
struct Exam {
    string ipfsCID;        // Content Identifier on IPFS for the encrypted PDF
    uint256 unlockTime;    // UNIX timestamp after which the key is unlocked
    string encryptedKey;   // AES-256 key required to decrypt the PDF
    address examiner;      // Wallet address that created the exam
    bool exists;           // Existence guard flag
}
```

### Functions
* `createExam(uint256 _examId, string _ipfsCID, uint256 _unlockTime, string _encryptedKey, address[] _authorizedCenters)`:
  Stores the encrypted exam record and populates the center whitelist.
* `getDecryptionKey(uint256 _examId) external view returns (string memory)`:
  Returns the secret AES key **only** if `block.timestamp >= unlockTime` and `msg.sender` is authorized.
* `getExamMetadata(uint256 _examId, address _center) external view returns (...)`:
  Provides public metadata (CID, unlock timestamp, examiner, authorization status) without revealing the AES key.

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.
