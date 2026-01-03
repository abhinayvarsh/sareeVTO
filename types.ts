export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface TryOnState {
  humanImage: ImageFile | null;
  sareeImage: ImageFile | null;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
}

// Extend window for AI Studio specific methods
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}