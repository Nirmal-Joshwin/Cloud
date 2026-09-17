"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  getExamVaultContract,
  advanceLocalEvmTime,
  hasInjectedWallet,
  HARDHAT_TEST_ACCOUNTS,
} from "@/lib/contract";
import { fetchEncryptedFromIPFS, IPFSRetrieveResult } from "@/lib/ipfs";
import { decryptToBlob, triggerFileDownload } from "@/lib/crypto";
import {
  Building2,
  Lock,
  Unlock,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  FileText,
  FastForward,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";

interface ExamMetadataState {
  examId: string;
  ipfsCID: string;
  unlockTime: number;
  examiner: string;
  isAuthorized: boolean;
  isUnlocked: boolean;
}

export default function ExamCenterPage() {
  const [examIdInput, setExamIdInput] = useState<string>("");
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(true);

  // Exam Details
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [examData, setExamData] = useState<ExamMetadataState | null>(null);
  const [encryptedFilePayload, setEncryptedFilePayload] =
    useState<IPFSRetrieveResult | null>(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);

  // Time-lock countdown state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Unlock & Decrypt State
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const hasInjected = hasInjectedWallet();
    setHasMetaMask(hasInjected);

    // If in demo mode without MetaMask, default to Account #1 (Authorized Center 1)
    const initialIndex = !hasInjected ? 1 : undefined;
    connectWallet(initialIndex)
      .then((w) => {
        setActiveAccount(w.address);
        setIsDemoMode(w.isDemoWallet);
      })
      .catch(() => {
        // Will be connected on user action
      });
  }, []);

  const handleSwitchCenterAccount = async (idx: number) => {
    try {
      const res = await connectWallet(idx);
      setActiveAccount(res.address);
      setIsDemoMode(true);
      // If an exam was loaded, refresh its authorization for the newly selected account
      if (examIdInput.trim()) {
        setTimeout(() => handleLookupExam(), 100);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to switch account");
    }
  };

  // Fetch Exam Metadata from Smart Contract
  const handleLookupExam = useCallback(async () => {
    if (!examIdInput.trim()) {
      setErrorMessage("Please enter an Exam ID.");
      return;
    }

    setErrorMessage(null);
    setExamData(null);
    setEncryptedFilePayload(null);
    setUnlockSuccess(false);
    setDecryptedKey(null);

    try {
      setIsLoadingDetails(true);

      const wallet = await connectWallet();
      setActiveAccount(wallet.address);
      setIsDemoMode(wallet.isDemoWallet);

      const contract = getExamVaultContract(wallet.signer);
      const examId = BigInt(examIdInput.trim());

      // Call getExamMetadata(examId, wallet.address)
      const res = await contract.getExamMetadata(examId, wallet.address);
      const [ipfsCID, unlockTimeBN, examiner, isCallerAuthorized, isUnlocked] = res;

      const unlockTimestamp = Number(unlockTimeBN);
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, unlockTimestamp - now);

      setExamData({
        examId: examIdInput.trim(),
        ipfsCID,
        unlockTime: unlockTimestamp,
        examiner,
        isAuthorized: isCallerAuthorized,
        isUnlocked: isUnlocked || remaining === 0,
      });

      setSecondsRemaining(remaining);

      // Pre-fetch encrypted payload from IPFS
      setIsFetchingFile(true);
      try {
        const filePayload = await fetchEncryptedFromIPFS(ipfsCID);
        setEncryptedFilePayload(filePayload);
      } catch (ipfsErr: unknown) {
        console.warn("Could not prefetch from IPFS:", ipfsErr);
      } finally {
        setIsFetchingFile(false);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { reason?: string; message?: string };
      let message =
        error.reason || error.message || "Failed to fetch exam details from blockchain";
      if (message.includes("could not detect network") || message.includes("ECONNREFUSED")) {
        message =
          "Cannot reach local Hardhat node at http://127.0.0.1:8545. Please ensure 'npx hardhat node' is running in your terminal.";
      }
      setErrorMessage(message);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [examIdInput]);

  // Real-time Countdown Timer
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (examData) {
            setExamData({ ...examData, isUnlocked: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, examData]);

  // Unlock Paper & Decrypt locally
  const handleUnlockAndDownload = async () => {
    if (!examData) return;

    setErrorMessage(null);
    setIsUnlocking(true);

    try {
      const wallet = await connectWallet();
      const contract = getExamVaultContract(wallet.signer);

      // 1. Fetch the decryption key from the smart contract
      // Use staticCall to guarantee we receive the string return value
      let key: string;
      if (contract.getDecryptionKey && typeof contract.getDecryptionKey.staticCall === "function") {
        key = await contract.getDecryptionKey.staticCall(BigInt(examData.examId));
      } else {
        key = await contract.getDecryptionKey(BigInt(examData.examId));
      }

      if (!key || typeof key !== "string") {
        throw new Error(`Invalid decryption key returned from blockchain: expected string, received ${typeof key}`);
      }

      setDecryptedKey(key);

      // 2. Fetch encrypted payload if not already pre-fetched
      let payload = encryptedFilePayload;
      if (!payload) {
        payload = await fetchEncryptedFromIPFS(examData.ipfsCID);
        setEncryptedFilePayload(payload);
      }

      if (!payload || !payload.ciphertext) {
        throw new Error("Could not retrieve encrypted payload from IPFS.");
      }

      // 3. Decrypt ciphertext locally using CryptoJS
      const pdfBlob = decryptToBlob(payload.ciphertext, key, "application/pdf");

      // 4. Trigger browser download
      const fileName = payload.fileName || `Exam_${examData.examId}_Paper.pdf`;
      triggerFileDownload(pdfBlob, fileName);


      setUnlockSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { reason?: string; message?: string };
      setErrorMessage(
        error.reason ||
          error.message ||
          "Failed to unlock paper. Verify your center is authorized and the time-lock has expired."
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  // Fast-Forward EVM Clock (Local Hardhat Testing Helper)
  const handleFastForward = async (minutes: number) => {
    try {
      await advanceLocalEvmTime(minutes * 60);
      handleLookupExam();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Could not fast-forward EVM time: ${error.message}`);
    }
  };

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Building2 className="w-3.5 h-3.5" /> Exam Center Portal
        </div>
        <h1 className="text-3xl font-extrabold text-white">Retrieve & Unlock Exam Paper</h1>
        <p className="text-slate-400 text-sm mt-1">
          Verify center authorization, observe the immutable time-lock countdown, and securely decrypt the question paper locally once the exam window commences.
        </p>
      </div>

      {/* Demo Mode / MetaMask Notice Banner */}
      {!hasMetaMask && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold">MetaMask not detected.</span> Testing via{" "}
              <strong className="text-white">Hardhat Demo Mode</strong> accounts.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Wallet:</span>
            <select
              value={isDemoMode && activeAccount ? activeAccount : HARDHAT_TEST_ACCOUNTS[1].address}
              onChange={(e) => {
                const idx = HARDHAT_TEST_ACCOUNTS.findIndex((a) => a.address === e.target.value);
                if (idx !== -1) handleSwitchCenterAccount(idx);
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

      {/* Lookup Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="number"
              value={examIdInput}
              onChange={(e) => setExamIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookupExam()}
              placeholder="Enter Exam ID (e.g. 101)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={handleLookupExam}
            disabled={isLoadingDetails}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-medium text-sm transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingDetails ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Blockchain...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Exam Vault</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Hardhat Time Advancer Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Local Hardhat Testing: Fast-forward EVM Clock without waiting</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFastForward(5)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
            >
              <FastForward className="w-3 h-3" /> +5 Mins
            </button>
            <button
              onClick={() => handleFastForward(15)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
            >
              <FastForward className="w-3 h-3" /> +15 Mins
            </button>
            <button
              onClick={() => handleFastForward(60)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
            >
              <FastForward className="w-3 h-3" /> +1 Hour
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Exam Details Card */}
      {examData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-sm">
                    #{examData.examId}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Exam Paper Vault Record</h3>
                    <div className="text-xs text-slate-400">Verified by Solidity Smart Contract</div>
                  </div>
                </div>

                {/* Status Badge */}
                {examData.isUnlocked ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    <Unlock className="w-3.5 h-3.5" />
                    Unlocked
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Time-Locked
                  </div>
                )}
              </div>

              {/* Grid of metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Examiner Address:</span>
                  <span className="font-mono text-slate-200 break-all">{examData.examiner}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Scheduled Unlock Time:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(examData.unlockTime * 1000).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Encrypted IPFS CID:</span>
                  <span className="font-mono text-purple-300 break-all">{examData.ipfsCID}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Center Authorization:</span>
                  {examData.isAuthorized ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Whitelisted Center
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" /> Not Whitelisted
                    </span>
                  )}
                </div>
              </div>

              {/* File Info */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {encryptedFilePayload ? encryptedFilePayload.fileName : "Encrypted Exam Paper.pdf"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {isFetchingFile
                        ? "Fetching encrypted payload from IPFS..."
                        : encryptedFilePayload
                        ? `${(encryptedFilePayload.fileSize / 1024).toFixed(1)} KB (AES-256 Encrypted Payload)`
                        : "Payload ready on IPFS"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card: Unlock Button */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2">Paper Decryption & Retrieval</h4>
              <p className="text-xs text-slate-400 mb-6">
                When the unlock timestamp is reached, calling <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">getDecryptionKey()</code> releases the AES-256 key from the contract. Your browser will immediately decrypt the PDF and initiate a direct download.
              </p>

              {!examData.isAuthorized ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>The connected wallet is not whitelisted for this exam. Key retrieval will be denied by the contract.</span>
                </div>
              ) : !examData.isUnlocked ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Paper is Time-Locked (Wait for Countdown)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnlockAndDownload}
                  disabled={isUnlocking}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Retrieving Key & Decrypting PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Unlock Paper & Download PDF</span>
                    </>
                  )}
                </button>
              )}

              {/* Unlock Success Confirmation */}
              {unlockSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Decryption Succeeded & Download Triggered!
                  </div>
                  <p className="text-slate-300">
                    The exam paper was successfully decrypted in your browser and saved to your device.
                  </p>
                  {decryptedKey && (
                    <div className="pt-2 font-mono text-[11px] text-slate-400 break-all">
                      Decryption Key: <span className="text-emerald-400">{decryptedKey}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Countdown & Security Proof */}
          <div className="space-y-6">
            {/* Live Countdown Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Time-Lock Status
              </h4>

              {secondsRemaining !== null && secondsRemaining > 0 ? (
                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-wider my-3 text-purple-300">
                    {formatTime(secondsRemaining)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Remaining until smart contract key release
                  </p>
                </div>
              ) : (
                <div className="my-4">
                  <div className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6" />
                    Window Open
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Exam has commenced. Decryption key is unlocked.
                  </p>
                </div>
              )}
            </div>

            {/* Verification checklist */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Zero-Trust Guarantee
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Payload is encrypted at rest using AES-256</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>No central authority can override the unlock timestamp</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Decryption executes 100% locally in browser memory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
