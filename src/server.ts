import Express, { Application, NextFunction, Request, Response } from "express";
import morgen from "morgan";
import cors from "cors";
import pool from "./utils/db";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { resolvers, typeDefs } from "./schema";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";

pool
  .connect()
  .then(() => {
    console.log("Connected to Postgres");
  })
  .catch((error) => {
    console.log("Error connecting to Postgres", error.message);
    process.exit(1);
  });

const app: Application = Express();

app.use(morgen("dev"));
app.use(Express.json());
app.use(
  cors({
    origin: "*"
  })
);

const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const serverCleanup = useServer(
  {
    schema,
    onConnect(ctx) {
      console.log("client Connected: ", ctx);
    },
  },
  wsServer
);

const startApolloServer = async () => {
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  app.use("/graphql", expressMiddleware(server));
};

startApolloServer();

const PORT = process.env.PORT || 5000;

app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/user", require("./routers/user.routes"));
app.use("/api/v1/post", require("./routers/post.routes"));

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL server running on http://localhost:${PORT}/graphql`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/graphql`);
});