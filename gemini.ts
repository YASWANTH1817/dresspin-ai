import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface PinData {
  imageUrl: string;
  hashtags: string[];
  caption: string;
  comments: string[];
}

export async function generatePin(imageBase64: string, mimeType: string, prompt: string = "", template: string = "Classic Luxury", withModel: boolean = true): Promise<PinData> {
  // Use both API key environment variables to ensure compatibility
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const modelRequirement = withModel 
    ? `- If flat lay: Transform into a stunning worn look on a model in an elegant setting.
       - If model present: Keep face/body same but upgrade pose, lighting, makeup.`
    : `- If model present: Remove the model and focus ONLY on the dress as a high-end product shot (ghost mannequin or elegant hanger).
       - If flat lay: Enhance as a professional flat lay or product shot on a minimalist background.`;

  // Call 1: Generate the enhanced image using gemini-2.5-flash-image
  const imagePromise = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64.split(',')[1] || imageBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a luxury fashion image editor for "Sri Navastra Boutique". 
          Edit this dress photo into a high-end Pinterest pin using the "${template}" template.
          
          TEMPLATE SPECIFICATIONS:
          - Classic Luxury: Pure white background, minimalist, soft shadows.
          - Golden Hour: Warm sunset lighting, soft focus background, romantic movement.
          - Studio Pro: High-contrast studio lighting, sharp textures, bold and modern.
          - Editorial: Magazine-style layout, sophisticated color grading.
          
          REQUIREMENTS:
          - Style: Professional high-end fashion photography.
          - Layout: Vertical 2:3 aspect ratio.
          ${modelRequirement}
          - Subtly incorporate "Sri Navastra Boutique" as a premium watermark if possible.
          
          Return ONLY the enhanced image.`,
        },
      ],
    },
  });

  // Call 2: Generate the metadata using gemini-3-flash-preview
  const metadataPromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are "DressPin AI", a luxury fashion content creator for "Sri Navastra Boutique".
    Generate Pinterest content for a dress pin.
    
    REQUIREMENTS:
    - 15 targeted hashtags (fashion, luxury, boutique, specific to the dress).
    - One SEO-optimized Pinterest caption (150-250 characters, engaging, mentioning Sri Navastra Boutique).
    - 8 engaging suggested comments.
    
    Return the result in JSON format:
    {
      "hashtags": ["#tag1", "#tag2", ...],
      "caption": "...",
      "comments": ["...", "..."]
    }`,
    config: {
      responseMimeType: "application/json",
    }
  });

  // Wait for both calls to complete
  const [imageResponse, metadataResponse] = await Promise.all([imagePromise, metadataPromise]);

  // Parse Metadata
  let pinContent: { hashtags: string[]; caption: string; comments: string[] } = {
    hashtags: [],
    caption: "",
    comments: [],
  };

  try {
    pinContent = JSON.parse(metadataResponse.text || "{}");
  } catch (e) {
    console.error("Failed to parse metadata JSON", e);
  }

  // Extract Image
  let finalImageUrl = "";
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      finalImageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  // Fallback: If image generation failed, use the original image (better than erroring)
  if (!finalImageUrl) {
    console.warn("Model failed to generate image, falling back to original.");
    finalImageUrl = imageBase64;
  }

  return {
    imageUrl: finalImageUrl,
    hashtags: pinContent.hashtags || [],
    caption: pinContent.caption || "",
    comments: pinContent.comments || [],
  };
}
