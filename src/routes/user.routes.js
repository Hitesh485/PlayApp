import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// the upload.fields are the middleware
router.route("/register").post(
    upload.fields([
        {
            name: "avatar", // first file and at frontend field will also same name
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

// router.route("/login").post()

export default router;
