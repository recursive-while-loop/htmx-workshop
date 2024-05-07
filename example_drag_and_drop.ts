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

  const allChats = await prisma.chat.findMany({
    where: {
      userId: user.id,
    },
  });
  const folders = await prisma.folder.findMany();

  folders.forEach((folder: Folder) => {
    // @ts-ignore
    folder.chats = allChats.filter((chat) => chat.folderId === folder.id);
  });

  console.log(folders);

  const chatsWithoutFolder = allChats.filter((chat) => !chat.folderId);

  res.render("example_drag_and_drop", {
    chats: chatsWithoutFolder,
    folders,
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

app.post("/folder", async (req, res) => {
  const user = (await prisma.user.findFirst()) as User;

  const folder = await prisma.folder.create({
    data: {
      title: "New Folder",
    },
  });

  res.render("partials/add_folder", {
    folder,
  });
});

app.post("/chat/:id/set-folder/:folderId", async (req, res) => {
  await prisma.chat.update({
    where: {
      id: req.params.id,
    },
    data: {
      folderId: req.params.folderId,
    },
  });

  const user = (await prisma.user.findFirst()) as User;

  const allChats = await prisma.chat.findMany({
    where: {
      userId: user.id,
    },
  });
  const folders = await prisma.folder.findMany();

  folders.forEach((folder: Folder) => {
    // @ts-ignore
    folder.chats = allChats.filter((chat) => chat.folderId === folder.id);
  });

  const chatsWithoutFolder = allChats.filter((chat) => !chat.folderId);

  res.render("example_drag_and_drop", {
    chats: chatsWithoutFolder,
    folders,
    layout: false,
  });
});

app.listen(3000, () => {
  console.log("express-handlebars example server listening on: 3000");
});
