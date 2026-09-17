"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  switchToHardhatNetwork,
  switchToSepoliaNetwork,
  hasInjectedWallet,
  HARDHAT_TEST_ACCOUNTS,
} from "@/lib/contract";
import {
  Shield,
  Key,
  Building2,
  Wallet,
  ExternalLink,
  ChevronDown,
  Globe,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedDemoIdx, setSelectedDemoIdx] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(true);

  useEffect(() => {
    const hasWallet = hasInjectedWallet();
    setIsMetaMaskAvailable(hasWallet);

    if (hasWallet) {
      const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
      eth.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsDemo(false);
            const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
            provider.getNetwork().then((net) => setChainId(net.chainId)).catch(console.error);
          }
        })
        .catch(console.error);

      const anyEth = (window as unknown as { ethereum: { on: (event: string, handler: (accounts: string[]) => void) => void } }).ethereum;
      anyEth.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });
      anyEth.on("chainChanged", () => {
        window.location.reload();
      });
    } else {
      // Auto-connect with default demo account if no MetaMask extension
      const savedIdx = localStorage.getItem("examvault_demo_account");
      const idx = savedIdx ? parseInt(savedIdx, 10) : 0;
      setSelectedDemoIdx(idx);
      setAccount(HARDHAT_TEST_ACCOUNTS[idx].address);
      setIsDemo(true);
      setChainId(31337n);
    }
  }, []);

  const handleConnect = async (forceDemoIdx?: number) => {
    try {
      setConnecting(true);
      const res = await connectWallet(forceDemoIdx);
      setAccount(res.address);
      setChainId(res.chainId);
      setIsDemo(res.isDemoWallet);
      if (res.isDemoWallet && forceDemoIdx !== undefined) {
        setSelectedDemoIdx(forceDemoIdx);
      }
      setShowAccountMenu(false);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectDemoAccount = (idx: number) => {
    handleConnect(idx);
  };

  const isHardhat = chainId === 31337n;
  const isSepolia = chainId === 11155111n;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Exam<span className="text-indigo-400">Vault</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Web3
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Time-Locked Security</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/examiner"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/examiner"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Key className="w-4 h-4 text-indigo-400" />
            Examiner Portal
          </Link>

          <Link
            href="/exam-center"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/exam-center"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            Exam Center Portal
          </Link>
        </nav>

        {/* Wallet & Account Control */}
        <div className="flex items-center gap-3 relative">
          {/* Network Badge */}
          {account && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSepolia
                    ? "bg-sky-400"
                    : isHardhat
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <span className="font-mono text-[11px]">
                {isSepolia
                  ? "Sepolia"
                  : isHardhat
                  ? "Hardhat"
                  : chainId
                  ? `Chain ${chainId}`
                  : "Connected"}
              </span>
            </div>
          )}

          {/* Demo Account Switcher Dropdown */}
          <div className="relative">
            {account ? (
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 text-xs font-mono transition shadow-sm"
              >
                {isDemo ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                <span>
                  {isDemo ? HARDHAT_TEST_ACCOUNTS[selectedDemoIdx].name.split(" ")[0] : "MetaMask"}:{" "}
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={() => handleConnect()}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-medium transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Dropdown Menu */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                  <span>Switch Test Account</span>
                  {isDemo && <span className="text-[10px] text-amber-400 font-mono">Demo Mode</span>}
                </div>

                <div className="space-y-1">
                  {HARDHAT_TEST_ACCOUNTS.map((acc, idx) => (
                    <button
                      key={acc.address}
                      onClick={() => handleSelectDemoAccount(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex flex-col ${
                        isDemo && selectedDemoIdx === idx
                          ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{acc.name}</span>
                        <span className="text-[10px] text-slate-400">{acc.role}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 truncate">
                        {acc.address}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Switch Networks if MetaMask is present */}
                {isMetaMaskAvailable && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 px-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                      Switch Network
                    </div>
                    <button
                      onClick={() => switchToSepoliaNetwork()}
                      className="w-full text-left px-2 py-1 rounded text-xs text-sky-400 hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" /> Switch to Sepolia Testnet
                    </button>
                    <button
                      onClick={() => switchToHardhatNetwork()}
                      className="w-full text-left px-2 py-1 rounded text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" /> Switch to Hardhat Localhost
                    </button>
                  </div>
                )}

                {!isMetaMaskAvailable && (
                  <div className="mt-2 pt-2 border-t border-slate-800 px-3 py-1 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>MetaMask extension not found</span>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      Install <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
