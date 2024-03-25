import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();
/* GET home page. */
export const postRegisterRoute = router.post(
  "/register",
  async function (req, res, next) {
    res.render("index", { title: "Express" });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    console.log("hashedPassword:", hashedPassword);
  }
);
