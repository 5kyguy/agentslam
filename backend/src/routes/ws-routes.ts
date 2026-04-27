import type { FastifyInstance } from "fastify";

export async function registerWsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    "/ws/matches/:id",
    { websocket: true },
    (socket, request) => {
      const matchId = request.params.id;
      const unsubscribe = app.matchService.onWsConnect(matchId, (event) => {
        socket.send(JSON.stringify(event));
      });

      socket.on("close", () => {
        unsubscribe();
      });
    }
  );
}
