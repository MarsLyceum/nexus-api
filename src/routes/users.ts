import express from "express";
const router = express.Router();

/* GET users listing. */
export const getUsersRouter = router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

export const postCreateUserRouter = router.post("/user");
