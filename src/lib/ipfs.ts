/**
 * IPFS Client helper functions
 */

export interface IPFSUploadResult {
  success: boolean;
  cid: string;
  provider: string;
  gatewayUrl: string;
  note?: string;
}

export interface IPFSRetrieveResult {
  examId: string;
  fileName: string;
  fileSize: number;
  ciphertext: string;
  uploadedAt: string;
}

/**
 * Upload encrypted exam paper payload to IPFS
 */
export async function uploadEncryptedToIPFS(
  ciphertext: string,
  fileName: string,
  fileSize: number,
  examId: string
): Promise<IPFSUploadResult> {
  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ciphertext, fileName, fileSize, examId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload to IPFS");
  }

  return res.json();
}

/**
 * Fetch encrypted exam paper payload from IPFS by CID
 */
export async function fetchEncryptedFromIPFS(cid: string): Promise<IPFSRetrieveResult> {
  const res = await fetch(`/api/ipfs/retrieve?cid=${encodeURIComponent(cid)}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch from IPFS (CID: ${cid})`);
  }

  return res.json();
}

