import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory / temporary store for mock IPFS storage when Pinata keys are not configured
// This allows immediate local development and zero-configuration testing
const mockIpfsStore = new Map<string, string>();

// Expose mock store globally so retrieve route can access it in dev mode
declare global {
  // eslint-disable-next-line no-var
  var __mockIpfsStore: Map<string, string> | undefined;
}
if (!global.__mockIpfsStore) {
  global.__mockIpfsStore = mockIpfsStore;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ciphertext, fileName, fileSize, examId } = body;

    if (!ciphertext) {
      return NextResponse.json(
        { error: "Missing ciphertext payload" },
        { status: 400 }
      );
    }

    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;

    const payload = JSON.stringify({
      examId: examId || "unknown",
      fileName: fileName || "exam_paper.pdf",
      fileSize: fileSize || 0,
      ciphertext,
      uploadedAt: new Date().toISOString(),
    });

    // Check if real Pinata credentials are provided
    if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (pinataJwt) {
          headers["Authorization"] = `Bearer ${pinataJwt.trim()}`;
        } else if (pinataApiKey && pinataSecretKey) {
          headers["pinata_api_key"] = pinataApiKey.trim();
          headers["pinata_secret_api_key"] = pinataSecretKey.trim();
        }

        const pinataResponse = await fetch(
          "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              pinataContent: JSON.parse(payload),
              pinataMetadata: {
                name: `ExamVault_${examId || "paper"}_${Date.now()}`,
              },
            }),
          }
        );

        if (pinataResponse.ok) {
          const pinataData = await pinataResponse.json();
          const cid = pinataData.IpfsHash;

          // Also save in local mock store for instant cached lookup
          global.__mockIpfsStore?.set(cid, payload);

          return NextResponse.json({
            success: true,
            cid,
            provider: "Pinata IPFS",
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
          });
        } else {
          console.warn("Pinata API returned error, falling back to simulated IPFS node:", await pinataResponse.text());
        }
      } catch (pinataErr) {
        console.warn("Pinata connection error, falling back to local simulation:", pinataErr);
      }
    }

    // Fallback: Generate a deterministic IPFS v0 CID-like hash for local mock testing
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    const simulatedCid = `QmLocal${hash.slice(0, 40)}`;

    global.__mockIpfsStore?.set(simulatedCid, payload);

    return NextResponse.json({
      success: true,
      cid: simulatedCid,
      provider: "Simulated Local IPFS Node",
      gatewayUrl: `/api/ipfs/retrieve?cid=${simulatedCid}`,
      note: "Stored in simulated decentralized storage. Configure PINATA_JWT in .env.local to use Pinata Cloud.",
    });
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

