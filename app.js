import express from "express";
import bodyParser from "body-parser";
import expressLayouts from "express-ejs-layouts";

const port = 3000;
const app = express();
var arr = [];

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.get("/", (req, res) => {
  res.render("pages/home", { currentPath: "/" });
});
app.get("/about", (req, res) => {
  res.render("pages/about", { currentPath: "/about" });
});
app.get("/blog", (req, res) => {
  res.render("pages/blog", { currentPath: "/blog", posts: arr });
});
app.post("/blog", (req, res) => {
  let title = req.body.title;
  let content = req.body.content;
  let id = "id" + Math.random().toString(16).slice(2);
  if (title && content) {
    const newPost = {
      title: title,
      content: content,
      id: id,
    };
    arr.push(newPost);
  }
  console.log(arr);
  res.redirect("/blog");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
