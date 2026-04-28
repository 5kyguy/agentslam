import type { FastifyInstance } from "fastify";
import type { AgentProcessManager } from "../agents/process-manager.js";

export async function registerAgentWsRoutes(app: FastifyInstance, processManager: AgentProcessManager): Promise<void> {
  app.get<{ Params: { agentId: string } }>(
    "/ws/agent/:agentId",
    { websocket: true },
    (socket, request) => {
      const agentId = request.params.agentId;
      const managed = processManager.get(agentId);
      if (!managed) {
        socket.close(4004, `No managed agent for id ${agentId}`);
        return;
      }
      managed.connection.register(socket as import("ws").WebSocket);
    },
  );
}
