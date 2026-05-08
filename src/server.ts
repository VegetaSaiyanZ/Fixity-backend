import app from "@/app";
import { EnvConfig } from "./handlers/env.handler";

const PORT = EnvConfig.instance.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
