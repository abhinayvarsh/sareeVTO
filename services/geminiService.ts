import { GoogleGenAI } from "@google/genai";
import { ImageFile } from "../types";

// We don't initialize the client globally because we need to ensure we pick up 
// the API key from the environment which might be injected after user selection.

export const generateTryOn = async (
  human: ImageFile, 
  saree: ImageFile
): Promise<string> => {
  // Always create a new instance to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Perform a highly realistic Virtual Try-On (VTO) task.
    
    INPUTS:
    - Image 1: The "Target Person".
    - Image 2: The "Garment" (Saree).
    
    STRICT OBJECTIVE:
    Digitally dress the "Target Person" in the "Garment" (Saree).
    
    CRITICAL PRIORITY: ABSOLUTE FACIAL PRESERVATION
    - The face of the person in the output MUST BE IDENTICAL to the face in Image 1.
    - Do NOT change the facial expression, make-up, skin texture, age, or identity.
    - Do NOT "beautify" or "AI-generate" a new face. 
    - Treat the face area as a strict copy-paste constraint from the original image.
    
    SECONDARY CONSTRAINTS:
    1. BODY INTEGRITY: 
       - Keep the exact body shape, height, and pose of Image 1.
       - Do not slim or alter the body proportions.
       
    2. GARMENT REALISM:
       - Apply the Saree from Image 2 onto the body.
       - Preserve the exact pattern, border (zari), color, and texture of the saree.
       - Drape it naturally (Nivi style) with realistic physics (folds, pleats).
       
    3. COMPOSITION:
       - Seamlessly blend the saree onto the neck and shoulders without altering the neck/face boundary.
       - Match the lighting of the saree to the person's environment.
    
    OUTPUT:
    - Return ONLY the final result image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Using the high-quality image model as requested
      contents: {
        parts: [
            { 
                inlineData: { 
                    mimeType: human.mimeType, 
                    data: human.base64 
                } 
            },
            {
                text: "Image 1: Target Person (FACE MUST REMAIN UNCHANGED)"
            },
            { 
                inlineData: { 
                    mimeType: saree.mimeType, 
                    data: saree.base64 
                } 
            },
            {
                text: "Image 2: Garment (Saree)"
            },
            { 
                text: prompt 
            }
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4", // Portrait for full body fashion
            imageSize: "2K",   // High resolution for details
        },
      },
    });

    // Extract the image from the response
    // The response structure for image generation contains the image in parts
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in the response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Helper to extract readable error message
    let message = "Failed to generate image. Please try again.";
    if (error.message) message = error.message;
    if (message.includes("API key")) message = "Invalid or missing API Key. Please connect your account.";
    throw new Error(message);
  }
};