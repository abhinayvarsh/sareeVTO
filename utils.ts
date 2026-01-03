import { ImageFile } from './types';

export const processFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const result = e.target.result as string;
        // split ';base64,' to get raw base64 string
        const base64 = result.split(',')[1];
        const mimeType = file.type;
        
        resolve({
          file,
          previewUrl: result,
          base64,
          mimeType
        });
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
