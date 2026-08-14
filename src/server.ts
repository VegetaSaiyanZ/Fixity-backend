import initApp from "./app";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";

initApp()
  .then((app) => {
    const PORT = process.env.PORT || 80;
    const HTTPS_PORT = process.env.HTTPS_PORT || 443;
    const NODE_ENV = process.env.NODE_ENV;

    const certPath = path.resolve(__dirname, "../../client-cert.pem");
    const keyPath = path.resolve(__dirname, "../../client-key.pem");

    const useHttps =
      NODE_ENV === "production" &&
      fs.existsSync(certPath) &&
      fs.existsSync(keyPath);

    if (useHttps) {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };

      https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
        console.log(
          `Production server running with HTTPS on port ${HTTPS_PORT}`
        );
      });
    } else {
      if (NODE_ENV === "production") {
        console.warn(
          "SSL certificates not found in /certs. Falling back to HTTP."
        );
      }

      http.createServer(app).listen(PORT, () => {
        console.log(
          `Server is running on http://localhost:${PORT} (${NODE_ENV} mode)`
        );
      });
    }
  })
  .catch((err) => {
    console.error("Failed to initialize application:", err);
    process.exit(1);
  });
