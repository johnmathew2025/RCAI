export const ACCEPTED_FILE_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/pdf": [".pdf"],
  "application/json": [".json"],
  "text/plain": [".txt"],
} as const;

export const MAX_FILE_SIZE = parseInt(process.env.VITE_MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  switch (mimeType) {
    case "text/csv":
      return "📊";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return "📈";
    case "application/pdf":
      return "📄";
    case "application/json":
      return "🔧";
    case "text/plain":
      return "📝";
    default:
      return "📁";
  }
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  // Check file type
  const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
  if (!acceptedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type not supported. Please upload CSV, Excel, PDF, JSON, or TXT files.",
    };
  }

  return { isValid: true };
}
