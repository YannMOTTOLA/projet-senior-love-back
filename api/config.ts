export const config = {
  port: Number.parseInt(process.env.PORT || "3001"),
  allowedOrigins: getEnv(process.env.ALLOWED_ORIGINS, "ALLOWED_ORIGINS"),
  jwtSecret: getEnv(process.env.JWT_SECRET, "JWT_SECRET"),
  vision: process.env.GOOGLE_CREDENTIALS_JSON,
 sirene: getEnv(process.env.SIRENE_API_TOKEN, "SIRENE_API_TOKEN")
};


function getEnv(value: string | undefined, variableName: string) {
  if (!value) { throw new Error(`Missing env variable: ${variableName}`); }
  return value;
}