import vision from "@google-cloud/vision";

function createVisionClient() {
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);

      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
      }

      return new vision.ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
      });
    } catch {
      throw new Error(
        "invalid GOOGLE_CREDENTIALS_JSON"
      );
    }
  }

  return new vision.ImageAnnotatorClient();
}

export const visionClient = createVisionClient();
