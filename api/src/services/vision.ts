import vision from "@google-cloud/vision";

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON || "{}");

export const visionClient = new vision.ImageAnnotatorClient({
  credentials,
});