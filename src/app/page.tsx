import Link from "next/link";
import { Shield, Key, Clock, Lock, FileCheck, ArrowRight, ServerOff, Database, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield className="w-3.5 h-3.5" /> Next-Gen Anti-Leak Infrastructure
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Decentralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Time-Locked</span> Exam Paper Security
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl leading-relaxed">
            Eliminates single-point-of-failure leaks by locking exam papers behind local AES-256 encryption, IPFS storage, and immutable blockchain time-locks.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/examiner"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/25 transition group"
            >
              <Key className="w-5 h-5 text-indigo-200" />
              <span>Examiner Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/exam-center"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium transition group"
            >
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Exam Center Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Local AES-256 Encryption</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Exam PDFs are encrypted directly inside the examiner&apos;s browser using a freshly generated 256-bit AES key. Plaintext files never leave the machine.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. IPFS Decentralized Storage</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The encrypted payload is pinned to IPFS via Pinata. Content-addressed CIDs ensure integrity and eliminate centralized server vulnerabilities.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Solidity Time-Lock Vault</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The AES decryption key is locked in the smart contract. Even administrators cannot retrieve the key before the verified blockchain timestamp.
            </p>
          </div>
        </div>

        {/* Architecture Pipeline */}
        <div className="glass-panel rounded-2xl p-8 border border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-400" />
            Zero-Trust Execution Workflow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Phase 1: Examiner</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Upload question paper PDF via drag & drop.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Generate unique AES-256 cryptographic key in client memory.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Upload ciphertext to IPFS and obtain CID.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Deploy <code className="text-xs text-indigo-300 bg-indigo-950/60 px-1 py-0.5 rounded">createExam()</code> with unlock timestamp and whitelist.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-400">Phase 2: Exam Center</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Connect authorized Ethereum wallet (MetaMask).</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Fetch encrypted PDF from IPFS ahead of exam time.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Smart contract automatically denies early access attempts.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>At exam start time: Retrieve key, decrypt locally, and print/view.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

