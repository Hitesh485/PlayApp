import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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


// here we currently don't have middleware->
// router.route("/logout").post(logoutUser);


router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT,logoutUser);

export default router;
