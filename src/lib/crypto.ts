import CryptoJS from "crypto-js";

/**
 * Generate a cryptographically secure 256-bit AES encryption key.
 * 32 bytes = 256 bits, returned as a 64-character hexadecimal string.
 */
export function generateAES256Key(): string {
  const randomWords = CryptoJS.lib.WordArray.random(32);
  return randomWords.toString(CryptoJS.enc.Hex);
}

/**
 * Encrypt a File (e.g. PDF) using AES-256.
 * The file is read as Base64, then encrypted with CryptoJS AES.
 */
export async function encryptFile(
  file: File,
  secretKey: string
): Promise<{
  ciphertext: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        // result is a data URL like: data:application/pdf;base64,JVBERi0xLjQK...
        // Extract base64 payload
        const base64Data = result.includes(",")
          ? result.split(",")[1]
          : result;

        // Encrypt base64 string using AES-256
        const encrypted = CryptoJS.AES.encrypt(base64Data, secretKey).toString();

        resolve({
          ciphertext: encrypted,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/pdf",
        });
      } catch (err) {
        reject(new Error(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file for encryption"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Decrypt ciphertext back to a PDF Blob using the AES-256 secret key.
 */
export function decryptToBlob(
  ciphertext: string,
  secretKey: string,
  mimeType = "application/pdf"
): Blob {
  if (!ciphertext || typeof ciphertext !== "string") {
    throw new Error("Invalid ciphertext: expected a non-empty string payload.");
  }
  if (!secretKey || typeof secretKey !== "string") {
    throw new Error(`Invalid decryption key: expected a string, received ${typeof secretKey}.`);
  }

  try {
    // Decrypt the ciphertext
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const base64Decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (!base64Decrypted) {
      throw new Error("Invalid decryption key or corrupted data. Decrypted content is empty.");
    }

    // Convert Base64 back to Uint8Array
    const binaryString = window.atob(base64Decrypted);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  } catch (err) {
    throw new Error(`Decryption failed: ${err instanceof Error ? err.message : "Invalid key or corrupted data"}`);
  }
}


/**
 * Triggers an immediate browser download for the decrypted Blob.
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 5000);
}

