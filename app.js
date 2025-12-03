import express from "express";
import bodyParser from "body-parser";
import expressLayouts from "express-ejs-layouts";
import pg from "pg";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();
const port = 3000;
const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn || false;
  next();
});

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function fetchPosts() {
  const result = await db.query("SELECT * FROM blog_posts ORDER BY id DESC");
  const posts = result.rows.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    image: post.image_name,
  }));
  return posts;
}

async function fetchPostById(id) {
  const result = await db.query("SELECT * FROM blog_posts WHERE id = $1", [id]);
  const post = result.rows[0];
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    image: post.image_name,
  };
}

const SINGLE_USER = {
  username: process.env.SINGLE_USER_USERNAME,
  passwordHash: process.env.SINGLE_USER_PASSWORD_HASH,
};

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.redirect("/login");
  next();
}

let featuredImages = [
  "/images/default.jpg",
  "/images/mykids.jpg",
  "/images/steakdinner.jpg",
];

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const uniqueName = "post_" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

app.get("/", async (req, res) => {
  try {
    res.render("pages/home", {
      currentPath: "/",
      featuredImages,
    });
  } catch (err) {
    console.log(err);
    res.send("Error fetching posts");
  }
});

app.get("/my-blogs", async (req, res) => {
  try {
    const posts = await fetchPosts();
    res.render("pages/my-blogs", { currentPath: "/my-blogs", posts });
  } catch (err) {
    console.log(err);
    res.send("Error fetching posts");
  }
});

app.get("/about", (req, res) => {
  res.render("pages/about", { currentPath: "/about" });
});

app.get("/blog", requireLogin, async (req, res) => {
  try {
    const posts = await fetchPosts();
    res.render("pages/blog", { currentPath: "/blog", posts: posts });
  } catch (err) {
    console.log(err);
    res.send("Error fetching posts");
  }
});

app.get("/posts/:id", async (req, res) => {
  try {
    const post = await fetchPostById(req.params.id);
    res.render("pages/posts", { currentPath: "/my-blogs", post });
  } catch (err) {
    console.log(err);
    res.send("Error fetching post");
  }
});

app.get("/login", (req, res) => {
  res.render("pages/login", { currentPath: "/login", error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (
    username === SINGLE_USER.username &&
    (await bcrypt.compare(password, SINGLE_USER.passwordHash))
  ) {
    req.session.loggedIn = true;
    res.redirect("/my-blogs");
  } else {
    res.render("pages/login", {
      currentPath: "/login",
      error: "Invalid credentials",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.post(
  "/blog",
  requireLogin,
  upload.single("image_file"),
  async (req, res) => {
    let { title, content } = req.body;
    if (!title || !content) return res.redirect("/blog");

    const image_name = req.file
      ? "/images/" + req.file.filename
      : "/images/default.jpg";

    try {
      await db.query(
        "INSERT INTO blog_posts (title, content, image_name) VALUES ($1, $2, $3)",
        [title, content, image_name]
      );
      res.redirect("/blog");
    } catch (err) {
      console.log(err);
      return res.send("Error saving post");
    }
  }
);

app.post("/delete-post", requireLogin, async (req, res) => {
  const { id } = req.body;
  try {
    await db.query("DELETE FROM blog_posts WHERE id = $1", [id]);
    res.redirect("/blog");
  } catch (err) {
    console.log(err);
    return res.send("Error deleting post");
  }
});

app.post("/update-post", requireLogin, async (req, res) => {
  const { id, title, content } = req.body;
  try {
    await db.query(
      "UPDATE blog_posts SET title = $1, content = $2 WHERE id = $3",
      [title, content, id]
    );
    res.redirect("/blog");
  } catch (err) {
    console.log(err);
    return res.send("Error updating post");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
