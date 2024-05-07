import * as path from "path";

import express from "express";
import { engine } from "express-handlebars";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

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

app.get("/", (req, res) => {
  res.render("example_toggle_button");
});

app.get("/toggle-on", (req, res) => {
  res.render("partials/toggle_on", {
    layout: false,
  });
});

app.get("/toggle-off", (req, res) => {
  res.render("partials/toggle_off", {
    layout: false,
  });
});

app.listen(3000, () => {
  console.log("express-handlebars example server listening on: 3000");
});
