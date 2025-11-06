import express from "express";
import bodyParser from "body-parser";
import expressLayouts from "express-ejs-layouts";

const port = 3000;
const app = express();
var arr = [
  {
    id: "id1",
    title: "Welcome to My Blog",
    content:
      "This is my very first post! Here I’ll share thoughts about web development, learning, and personal projects. Stay tuned for more updates.",
    image: "/images/default.jpg",
  },
  {
    id: "id2",
    title: "Learning Express.js Basics",
    content:
      "Express.js makes building web servers in Node easy and clean. I’ve started with simple routes and EJS templates — so far, it’s been a great experience!",
    image: "/images/mywife.jpg",
  },
  {
    id: "id3",
    title: "Future Plans for the Blog",
    content:
      "I plan to make each post open in its own page soon, add some categories, and maybe even allow images in posts. Small steps, one at a time.",
    image: "/images/personal.jpg",
  },
];
let featuredImages = [
  "/images/default.jpg",
  "/images/mywife.jpg",
  "/images/personal.jpg",
];

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.get("/", (req, res) => {
  res.render("pages/home", {
    currentPath: "/",
    posts: arr,
    featuredImages: featuredImages,
  });
});

app.get("/my-blogs", (req, res) => {
  res.render("pages/my-blogs", { currentPath: "/my-blogs", posts: arr });
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
  res.redirect("/blog");
});
app.get("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const post = arr.find((post) => post.id === postId);
  res.render("pages/posts", { currentPath: "/my-blogs", post: post });
});
app.post("/delete-post", (req, res) => {
  const postId = req.body.id;
  arr = arr.filter((post) => post.id !== postId);
  res.redirect("/blog");
});
app.post("/update-post", (req, res) => {
  const { id, title, content } = req.body;
  const postIndex = arr.findIndex((post) => post.id === id);
  if (postIndex !== -1) {
    arr[postIndex].title = title;
    arr[postIndex].content = content;
  }
  res.redirect("/blog");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
