import { createApp } from "./app.js";

const { app, config } = await createApp();

app
  .listen({ port: config.port, host: config.host })
  .then(() => {
    app.log.info({ port: config.port }, "Agent Slam backend listening");
  })
  .catch((error) => {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  });
