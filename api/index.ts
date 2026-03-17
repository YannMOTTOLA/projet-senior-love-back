import { config } from "./config.ts";
import { app } from "./src/app.ts";

// Lancer un serveur HTTP
app.listen(config.port, () => {
  console.log(`Server started at http://localhost:${config.port}/api`);
});