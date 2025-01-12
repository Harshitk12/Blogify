const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const { sign } = require("crypto");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  if(!req.user)
    return res.render("signin");
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );
  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.delete("/:blogId", async(req,res)=>{
  try {
    const blogId= req.params.blogId;
    await Comment.deleteMany({blogId});
    await Blog.findByIdAndDelete(blogId);
    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
})

router.post("/comment/:blogId", async (req, res) => {
  
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.delete("/:blogId/comment/:commentId", async(req,res)=>{
  try {
    const {blogId,commentId} = req.params;

    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
})

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
