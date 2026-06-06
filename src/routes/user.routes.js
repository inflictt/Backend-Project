import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();
userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,//no of file you'll take
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),//middleware so here placed multer file upld.
    registerUser); 
userRouter.route('/login').post(loginUser)
// secured routes
userRouter.route('/logout').post(verifyJWT,logoutUser)

userRouter.route("/refresh-token").post(refreshAccessToken)
export { userRouter };