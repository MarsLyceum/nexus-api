import express from "express";
const router = express.Router();

/* GET home page. */
export const getRootRouter = router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
