import { createApp } from "./app.js";

const { app, config } = await createApp();

app
  .listen({ port: config.port, host: config.host })
  .then(() => {
    app.log.info({ port: config.port, mode: config.backendMode }, "Agent Slam dummy backend listening");
  })
  .catch((error) => {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  });
