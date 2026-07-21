
export const convertToDirectDriveLink = (url: string): string => {
  if (!url || !url.trim()) return "";
  const trimmedUrl = url.trim();
  
  // Already converted or not a drive link
  if (!trimmedUrl.includes("drive.google.com")) return trimmedUrl;

  try {
    // Case 1: https://drive.google.com/file/d/ID/view...
    const fileIdMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }

    // Case 2: https://drive.google.com/uc?id=ID...
    const idParamMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
    }
    
    // Case 3: https://drive.google.com/open?id=ID...
    const openIdMatch = trimmedUrl.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch && openIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${openIdMatch[1]}`;
    }
  } catch (err) {
    console.warn("Error parsing drive link:", err);
  }

  return trimmedUrl;
};

export const getDriveIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) return fileIdMatch[1];

  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];
  
  return null;
};

export const uploadFileToDrive = async (accessToken: string, file: File, folderId: string): Promise<string> => {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || 'Failed to upload file to Google Drive');
  }

  const data = await response.json();
  return data.id;
};
