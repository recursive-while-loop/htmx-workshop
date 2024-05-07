import * as path from "path";
import { PassThrough } from "stream";

import express from "express";
import { engine } from "express-handlebars";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

import { Folder, PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

const initDB = async () => {
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: "john_doe",
        password: "1234",
      },
    });
  }
};

initDB();

const app = express();

app.engine(
  ".hbs",
  engine({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: "hbs",
  })
);
app.set("view engine", ".hbs");
app.set("views", path.resolve(__dirname, "./views"));

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views/**/*.hbs"),
  path.join(__dirname, "*.ts"),
]);

app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

app.get("/", async (req, res) => {
  const user = (await prisma.user.findFirst()) as User;

  const chats = await prisma.chat.findMany({
    where: {
      userId: user.id,
    },
  });
  res.render("example_crud", {
    chats,
  });
});

app.post("/chat", async (req, res) => {
  const user = (await prisma.user.findFirst()) as User;

  const chat = await prisma.chat.create({
    data: {
      title: "New Chat",
      userId: user.id,
    },
  });

  res.render("partials/add_chat", {
    chat,
  });
});

app.listen(3000, () => {
  console.log("express-handlebars example server listening on: 3000");
});
