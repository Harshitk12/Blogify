const { Router } = require("express");
const User = require("../models/user");
const { validateToken } = require("../services/authentication");
const Blog = require("../models/blog");
const multer = require("multer");
const path = require("path");


const router = Router();

router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if(!password || !email)
    return res.render("signin");
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

router.get("/info/:id", async (req,res)=>{
  const blogs = await Blog.find({ createdBy: req.params.id })
  const user = await User.findById(req.params.id);
  return res.render("user",{
    user,
    currUser:req.user,
    blogs
  });
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/images/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.post("/info/:id",upload.single("profileImageURL"), async (req,res)=>{
  const {fullName,email,age,profession}=req.body;
  try{
    const user = await User.findById(req.params.id);
    if(fullName)
      user.fullName=fullName;
    if(email)
      user.email = email;
    if(age)
      user.age=age;
    if(profession)
      user.profession=profession;
    if(req.file)
      user.profileImageURL=`/images/${req.file.filename}`;
    await user.save();
    if (!user) {
      console.log("User not found");
      return res.status(404).send("User not found");
  }
  
  const blogs = await Blog.find({ createdBy: req.params.id })
  return res.redirect(`/user/info/${user._id}`);
}
catch (error) {
  console.error("Error updating user:", error);
  return res.status(500).send("Server error");
}
})


module.exports = router;
