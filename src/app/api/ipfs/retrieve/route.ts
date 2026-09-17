import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json({ error: "Missing CID parameter" }, { status: 400 });
    }

    // 1. Check local mock store first
    if (global.__mockIpfsStore && global.__mockIpfsStore.has(cid)) {
      const dataStr = global.__mockIpfsStore.get(cid)!;
      return NextResponse.json(JSON.parse(dataStr));
    }

    // 2. If not in local mock store, try fetching from public IPFS gateways
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ];

    for (const gateway of gateways) {
      try {
        const res = await fetch(gateway, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = await res.json();
          // Cache in memory for subsequent requests
          global.__mockIpfsStore?.set(cid, JSON.stringify(json));
          return NextResponse.json(json);
        }
      } catch {
        // Try next gateway
      }
    }

    return NextResponse.json(
      { error: `Could not retrieve file from IPFS with CID: ${cid}` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error retrieving IPFS file" },
      { status: 500 }
    );
  }
}

