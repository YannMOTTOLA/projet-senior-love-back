import { config } from "./config.js";
import { app } from "./src/app.js";
// Lancer un serveur HTTP
app.listen(config.port, () => {
    console.log(`Server started at http://localhost:${config.port}/api`);
});
