import express from "express";

const router = express.Router();
/* GET home page. */
export const postRegisterRoute = router.post(
  "/register",
  async function (req, res, next) {
    res.render("index", { title: "Express" });

    console.log("hashedPassword:", hashedPassword);
  }
);
