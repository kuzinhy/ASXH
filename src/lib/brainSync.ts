import { collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export interface BrainDocument {
  id: string;
  name: string;
  mimeType: string;
  content: string;
  updatedAt: string;
}

// Default folder ID specified by the user
export const DEFAULT_FOLDER_ID = "1RIIJqdHEW_4S7rVE2fTLK0DSdqz3CCne";

/**
 * Lists files inside a Google Drive folder
 */
export async function listDriveFolderFiles(accessToken: string, folderId: string = DEFAULT_FOLDER_ID) {
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,description)&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to list folder files (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches content of a specific Drive file
 */
export async function fetchFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let url = "";
  
  if (mimeType === "application/vnd.google-apps.document") {
    // Google Doc export to plain text
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
    // Google Sheet export to CSV
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
  } else if (mimeType === "text/plain" || mimeType === "text/markdown" || mimeType === "application/json" || mimeType === "text/csv") {
    // Direct file media content
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  } else {
    // Unsupported type for direct text conversion, we return an empty content but will store metadata
    return "";
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn(`Could not fetch content for file ${fileId} of type ${mimeType}: ${response.statusText}`);
      return "";
    }

    return await response.text();
  } catch (err) {
    console.error(`Error downloading file ${fileId}:`, err);
    return "";
  }
}

/**
 * Syncs the whole Google Drive folder's documents to Firestore brain_documents collection
 */
export async function syncDriveFolderToFirestore(
  accessToken: string,
  folderId: string = DEFAULT_FOLDER_ID,
  onProgress?: (progress: { current: number; total: number; currentFileName: string }) => void
): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // 1. List files in folder
    const files = await listDriveFolderFiles(accessToken, folderId);
    const total = files.length;

    if (total === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    // 2. Clear old brain documents to avoid stale brain assets
    const colRef = collection(db, "brain_documents");
    const snapshot = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    snapshot.forEach((d) => {
      deleteBatch.delete(doc(db, "brain_documents", d.id));
    });
    await deleteBatch.commit();

    // 3. Sync each file
    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (onProgress) {
        onProgress({ current: i + 1, total, currentFileName: file.name });
      }

      let content = "";
      try {
        content = await fetchFileContent(accessToken, file.id, file.mimeType);
      } catch (fileErr: any) {
        errors.push(`Lỗi tải nội dung file "${file.name}": ${fileErr.message || fileErr}`);
      }

      // Store in firestore
      const docData: BrainDocument = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        content: content || file.description || "",
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "brain_documents", file.id), docData);
        syncedCount++;
      } catch (storeErr: any) {
        errors.push(`Lỗi lưu vào CSDL cho file "${file.name}": ${storeErr.message || storeErr}`);
      }
    }

    return { success: errors.length === 0, syncedCount, errors };
  } catch (err: any) {
    console.error("Sync Drive folder error:", err);
    return { success: false, syncedCount: 0, errors: [err.message || String(err)] };
  }
}

/**
 * Fetches all synced documents from Firestore
 */
export async function fetchSyncedBrainDocuments(): Promise<BrainDocument[]> {
  try {
    const colRef = collection(db, "brain_documents");
    const snapshot = await getDocs(colRef);
    const docs: BrainDocument[] = [];
    snapshot.forEach((d) => {
      docs.push(d.data() as BrainDocument);
    });
    return docs;
  } catch (err) {
    console.error("Error fetching brain documents:", err);
    return [];
  }
}
