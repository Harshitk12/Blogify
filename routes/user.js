const { Router } = require("express");
const User = require("../models/user");
const { validateToken } = require("../services/authentication");
const Blog = require("../models/blog");

const router = Router();

router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try { 
    const {token,user} = await User.matchPasswordAndGenerateToken(email, password);
    
    const allBlogs = await Blog.find({});
    res.cookie("token",token).render("home", {
      user: user,
      blogs: allBlogs,
    });
  } catch (error) {
    console.log(error)
    return res.render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  if(!password || !fullName || !email)
    return res.render("signup");
  await User.create({
    fullName,
    email,
    password,
  });
  return res.redirect("/");
});

module.exports = router;
