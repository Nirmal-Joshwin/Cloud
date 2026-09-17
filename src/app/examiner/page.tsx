"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { ethers } from "ethers";
import { generateAES256Key, encryptFile } from "@/lib/crypto";
import { uploadEncryptedToIPFS, IPFSUploadResult } from "@/lib/ipfs";
import {
  connectWallet,
  getExamVaultContract,
  getContractAddress,
  setCustomContractAddress,
  deployExamVaultFromBrowser,
  switchToSepoliaNetwork,
  hasInjectedWallet,
  HARDHAT_TEST_ACCOUNTS,
} from "@/lib/contract";

import {
  FileUp,
  Key,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Rocket,
  Settings,
  AlertTriangle,
} from "lucide-react";

export default function ExaminerPage() {
  // Form State
  const [examId, setExamId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aesKey, setAesKey] = useState<string>("");
  const [unlockDateTime, setUnlockDateTime] = useState<string>("");
  const [centerAddresses, setCenterAddresses] = useState<string[]>([""]);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(true);

  // Contract Address & Deployment State
  const [contractAddress, setContractAddress] = useState<string>("");
  const [customContractInput, setCustomContractInput] = useState<string>("");
  const [isDeployingContract, setIsDeployingContract] = useState(false);
  const [deployedNotice, setDeployedNotice] = useState<string | null>(null);

  // Status & Progress State
  const [statusStep, setStatusStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    examId: string;
    cid: string;
    unlockTime: number;
    txHash: string;
    ipfsProvider: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Initialize
  useEffect(() => {
    setAesKey(generateAES256Key());
    setExamId(Math.floor(100000 + Math.random() * 900000).toString());

    // Default unlock time: 10 minutes from now formatted for datetime-local input
    const date = new Date(Date.now() + 10 * 60 * 1000);
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setUnlockDateTime(localIso);

    const hasInjected = hasInjectedWallet();
    setHasMetaMask(hasInjected);

    const activeAddr = getContractAddress();
    setContractAddress(activeAddr);
    setCustomContractInput(activeAddr);

    connectWallet()
      .then((w) => {
        setWalletAccount(w.address);
        setIsDemoMode(w.isDemoWallet);
      })
      .catch(() => {});
  }, []);

  // Check if contract address is incorrectly set to the user's personal wallet
  const isAddressMisconfigured =
    Boolean(walletAccount &&
    contractAddress &&
    walletAccount.toLowerCase() === contractAddress.toLowerCase());

  // React Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setErrorMsg("Please upload a valid PDF document.");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleRegenerateKey = () => {
    setAesKey(generateAES256Key());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyContractAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Center Addresses Helpers
  const handleAddCenter = () => {
    setCenterAddresses([...centerAddresses, ""]);
  };

  const handleUpdateCenter = (index: number, value: string) => {
    const updated = [...centerAddresses];
    updated[index] = value;
    setCenterAddresses(updated);
  };

  const handleRemoveCenter = (index: number) => {
    if (centerAddresses.length === 1) {
      setCenterAddresses([""]);
    } else {
      setCenterAddresses(centerAddresses.filter((_, i) => i !== index));
    }
  };

  // Quick populate with Hardhat Default Center Accounts for convenient testing
  const populateTestCenters = () => {
    setCenterAddresses([
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
    ]);
  };

  // Switch demo account helper
  const handleSwitchDemoAccount = async (idx: number) => {
    try {
      const res = await connectWallet(idx);
      setWalletAccount(res.address);
      setIsDemoMode(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to switch account");
    }
  };

  // In-Browser Contract Deployment via MetaMask
  const handleDeployContractFromBrowser = async () => {
    try {
      setIsDeployingContract(true);
      setErrorMsg(null);
      setDeployedNotice(null);

      // Auto-switch to Sepolia testnet to avoid expensive mainnet gas fees
      if (hasInjectedWallet()) {
        try {
          await switchToSepoliaNetwork();
        } catch (switchErr) {
          console.warn("Could not auto-switch network:", switchErr);
        }
      }

      const wallet = await connectWallet();
      const deployedAddr = await deployExamVaultFromBrowser(wallet.signer);

      setContractAddress(deployedAddr);
      setCustomContractInput(deployedAddr);
      setDeployedNotice(deployedAddr);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { reason?: string; message?: string };
      setErrorMsg(error.reason || error.message || "Failed to deploy contract via MetaMask");
    } finally {
      setIsDeployingContract(false);
    }
  };


  const handleSaveCustomContract = () => {
    if (!ethers.isAddress(customContractInput.trim())) {
      setErrorMsg("Invalid Ethereum contract address format.");
      return;
    }
    setCustomContractAddress(customContractInput.trim());
    setContractAddress(customContractInput.trim());
    setErrorMsg(null);
    alert("Contract address updated for this browser session!");
  };

  // Main Submit Pipeline: Encrypt -> Upload IPFS -> Deploy to Contract
  const handleCreateAndLockExam = async () => {
    setErrorMsg(null);
    setSuccessData(null);

    // Validation
    if (!selectedFile) {
      setErrorMsg("Please upload an exam paper PDF file.");
      return;
    }
    if (!examId.trim()) {
      setErrorMsg("Please provide an Exam ID.");
      return;
    }
    if (!unlockDateTime) {
      setErrorMsg("Please select an exam unlock date and time.");
      return;
    }

    const unlockTimestamp = Math.floor(new Date(unlockDateTime).getTime() / 1000);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (unlockTimestamp <= nowTimestamp) {
      setErrorMsg("Unlock time must be in the future.");
      return;
    }

    // Filter and validate center addresses
    const cleanedCenters = centerAddresses
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (cleanedCenters.length === 0) {
      setErrorMsg("Please provide at least one authorized exam center address.");
      return;
    }

    for (const addr of cleanedCenters) {
      if (!ethers.isAddress(addr)) {
        setErrorMsg(`Invalid Ethereum address: "${addr}". Please check the address format.`);
        return;
      }
    }

    try {
      setIsProcessing(true);

      // STEP 1: Connect Wallet & Get Signer
      const wallet = await connectWallet();
      setWalletAccount(wallet.address);
      setIsDemoMode(wallet.isDemoWallet);

      const activeContract = getContractAddress();
      if (wallet.address.toLowerCase() === activeContract.toLowerCase()) {
        throw new Error(
          `Contract Address (${activeContract}) is set to your personal wallet address. Smart contract calls cannot be sent to personal wallets. Please deploy the ExamVault contract first by clicking 'Deploy ExamVault to Sepolia' above.`
        );
      }

      // STEP 2: Local AES-256 Encryption
      setStatusStep(1);
      const encryptionResult = await encryptFile(selectedFile, aesKey);

      // STEP 3: IPFS Upload
      setStatusStep(2);
      const ipfsResult: IPFSUploadResult = await uploadEncryptedToIPFS(
        encryptionResult.ciphertext,
        selectedFile.name,
        selectedFile.size,
        examId
      );

      // STEP 4: Call Smart Contract
      setStatusStep(3);
      const contract = getExamVaultContract(wallet.signer, activeContract);

      const tx = await contract.createExam(
        BigInt(examId),
        ipfsResult.cid,
        BigInt(unlockTimestamp),
        aesKey,
        cleanedCenters
      );

      // Wait for 1 block confirmation
      const receipt = await tx.wait();
      setStatusStep(4);

      setSuccessData({
        examId,
        cid: ipfsResult.cid,
        unlockTime: unlockTimestamp,
        txHash: receipt.hash,
        ipfsProvider: ipfsResult.provider,
      });
    } catch (err: unknown) {
      console.error(err);
      const error = err as { reason?: string; message?: string; code?: string };
      let message = error.reason || error.message || "Transaction failed";
      if (message.includes("could not detect network") || message.includes("ECONNREFUSED")) {
        message =
          "Cannot reach local Hardhat node at http://127.0.0.1:8545. Please ensure 'npx hardhat node' is running in your terminal.";
      }
      setErrorMsg(message);
      setStatusStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Key className="w-3.5 h-3.5" /> Examiner Portal
        </div>
        <h1 className="text-3xl font-extrabold text-white">Encrypt & Lock Exam Paper</h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform client-side AES-256 encryption on the exam paper, distribute ciphertext via IPFS, and register the unlock time-lock in the smart contract.
        </p>
      </div>

      {/* Contract Address Configuration & 1-Click Deployer Card */}
      <div className="mb-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Settings className="w-4 h-4 text-indigo-400" />
            Smart Contract Target
          </div>
          <button
            type="button"
            onClick={handleDeployContractFromBrowser}
            disabled={isDeployingContract}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {isDeployingContract ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deploying to Sepolia via MetaMask...</span>
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5" />
                <span>Deploy ExamVault Contract to Sepolia</span>
              </>
            )}
          </button>
        </div>

        {/* Misconfiguration Alert */}
        {isAddressMisconfigured && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-300 font-semibold mb-0.5">
                Notice: Contract address is currently set to your personal wallet address!
              </strong>
              In Ethereum, smart contract transactions cannot be sent to personal wallets. Click the{" "}
              <strong className="text-white">&ldquo;Deploy ExamVault Contract to Sepolia&rdquo;</strong> button above to deploy your actual contract with your MetaMask wallet.
            </div>
          </div>
        )}

        {/* Successfully Deployed Notice */}
        {deployedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Contract Successfully Deployed to Sepolia!
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-200 break-all">
              <span>{deployedNotice}</span>
              <button
                type="button"
                onClick={() => copyContractAddress(deployedNotice)}
                className="p-1 text-slate-400 hover:text-white"
                title="Copy Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copiedAddress && <span className="text-[10px] text-emerald-400">Copied!</span>}
            </div>
            <p className="text-[11px] text-slate-400 pt-0.5">
              This address is now active for this browser. To make it permanent on Render, update your Render Environment Variable <code className="text-indigo-300">NEXT_PUBLIC_CONTRACT_ADDRESS</code> with this address.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customContractInput}
            onChange={(e) => setCustomContractInput(e.target.value)}
            placeholder="Contract Address (0x...)"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleSaveCustomContract}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Demo Mode / MetaMask Notice Banner */}
      {!hasMetaMask && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold">MetaMask not detected in this browser.</span> Built-in{" "}
              <strong className="text-white">Hardhat Demo Mode</strong> is active using local test accounts.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Signing as:</span>
            <select
              value={isDemoMode && walletAccount ? walletAccount : HARDHAT_TEST_ACCOUNTS[0].address}
              onChange={(e) => {
                const idx = HARDHAT_TEST_ACCOUNTS.findIndex((a) => a.address === e.target.value);
                if (idx !== -1) handleSwitchDemoAccount(idx);
              }}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none"
            >
              {HARDHAT_TEST_ACCOUNTS.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.name} ({acc.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: File Upload */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-indigo-400" />
              1. Exam Document (PDF)
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10"
                  : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-white text-base">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-200 font-medium">
                    Drag and drop your exam paper PDF here, or <span className="text-indigo-400">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Accepts .pdf files only</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Exam ID & AES-256 Key */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              2. Exam Identifier & Encryption Key
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Exam ID (Numerical)
                </label>
                <input
                  type="number"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Generated AES-256 Key
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={aesKey}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(aesKey)}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-white transition"
                    title="Copy AES Key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedKey && (
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">Copied to clipboard!</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Time Lock Schedule */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              3. Time-Lock Schedule
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Exam Paper Unlock Date & Time
              </label>
              <input
                type="datetime-local"
                value={unlockDateTime}
                onChange={(e) => setUnlockDateTime(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                UNIX Timestamp:{" "}
                <span className="font-mono text-indigo-400">
                  {unlockDateTime ? Math.floor(new Date(unlockDateTime).getTime() / 1000) : "N/A"}
                </span>
                . The smart contract strictly forbids key release prior to this moment.
              </p>
            </div>
          </div>

          {/* Section 4: Authorized Exam Centers */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                4. Authorized Exam Center Wallets
              </h3>
              <button
                type="button"
                onClick={populateTestCenters}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Use Hardhat Test Wallets
              </button>
            </div>

            <div className="space-y-2.5">
              {centerAddresses.map((addr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addr}
                    onChange={(e) => handleUpdateCenter(idx, e.target.value)}
                    placeholder={`Exam Center #${idx + 1} Address (0x...)`}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCenter(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCenter}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Exam Center Address
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
              <div className="break-all">{errorMsg}</div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleCreateAndLockExam}
            disabled={isProcessing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {statusStep === 1 && "Encrypting PDF with AES-256..."}
                  {statusStep === 2 && "Uploading Ciphertext to IPFS..."}
                  {statusStep === 3 && "Deploying to Smart Contract..."}
                  {statusStep === 4 && "Exam Paper Locked Successfully!"}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Lock & Publish Exam to Vault</span>
              </>
            )}
          </button>
        </div>

        {/* Right 1 Col: Status Tracker & Results */}
        <div className="space-y-6">
          {/* Progress Tracker */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Security Pipeline Status
            </h4>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    statusStep > 1
                      ? "bg-emerald-500 text-slate-950"
                      : statusStep === 1
                      ? "bg-indigo-600 text-white animate-pulse"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Local AES-256 Encryption</div>
                  <div className="text-[11px] text-slate-400">PDF bytes converted to ciphertext</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    statusStep > 2
                      ? "bg-emerald-500 text-slate-950"
                      : statusStep === 2
                      ? "bg-indigo-600 text-white animate-pulse"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">IPFS Decentralized Storage</div>
                  <div className="text-[11px] text-slate-400">Payload pinned via Pinata / IPFS</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    statusStep > 3
                      ? "bg-emerald-500 text-slate-950"
                      : statusStep === 3
                      ? "bg-indigo-600 text-white animate-pulse"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  3
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Solidity Smart Contract</div>
                  <div className="text-[11px] text-slate-400">createExam() time-lock mined</div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Card */}
          {successData && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Exam Vaulted Successfully!
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Exam ID:</span>
                  <span className="font-mono text-white font-bold">{successData.examId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">IPFS CID:</span>
                  <span className="font-mono text-indigo-300 break-all">{successData.cid}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Storage Provider:</span>
                  <span className="text-slate-200">{successData.ipfsProvider}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Unlock Timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(successData.unlockTime * 1000).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction Hash:</span>
                  <span className="font-mono text-slate-300 break-all">{successData.txHash}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
