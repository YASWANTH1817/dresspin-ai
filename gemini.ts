import { GoogleGenAI } from "@google/genai";

export interface PinData {
  imageUrl: string;
  hashtags: string[];
  caption: string;
  comments: string[];
}

export async function generatePin(
  imageBase64: string,
  mimeType: string,
  prompt: string = "",
  template: string = "Classic Luxury",
  withModel: boolean = true
): Promise<PinData> {

  // Correct way to read environment variable in Vite
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const modelRequirement = withModel
    ? `If flat lay: Transform into a stunning worn look on a model in an elegant setting.
       If model present: Keep face/body same but upgrade pose, lighting, makeup.`
    : `If model present: Remove the model and focus ONLY on the dress as a product shot.
       If flat lay: Enhance as a professional flat lay with clean background.`;

  // IMAGE GENERATION
  const imageResponse = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        inlineData: {
          data: imageBase64.split(",")[1] || imageBase64,
          mimeType: mimeType,
        },
      },
      {
        text: `
You are a luxury fashion editor for Sri Navastra Boutique.

Edit this dress image into a professional Pinterest fashion image.

Template: ${template}

Requirements:
- Vertical Pinterest layout
- Fashion studio quality lighting
- Premium boutique aesthetic
- Add subtle Sri Navastra Boutique branding
${modelRequirement}

Return the enhanced image.
        `,
      },
    ],
  });

  // CONTENT GENERATION
  const metadataResponse = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `
Generate Pinterest marketing content for a boutique dress.

Return JSON format:

{
 "hashtags": ["#fashion", "#boutique"],
 "caption": "Pinterest caption here",
 "comments": ["comment1","comment2"]
}
`,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Parse metadata
  let pinContent = {
    hashtags: [],
    caption: "",
    comments: [],
  };

  try {
    pinContent = JSON.parse(metadataResponse.text || "{}");
  } catch (err) {
    console.error("Metadata parse error", err);
  }

  // Extract image
  let imageUrl = "";

  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  if (!imageUrl) {
    imageUrl = imageBase64;
  }

  return {
    imageUrl,
    hashtags: pinContent.hashtags || [],
    caption: pinContent.caption || "",
    comments: pinContent.comments || [],
  };
}