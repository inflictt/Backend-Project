import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
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


userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)

userRouter.route("/current-user").get(getCurrentUser)

userRouter.route("/update-account").patch(updateAccountDetails)

userRouter.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

userRouter.route('/coverImage').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

userRouter.route("/channel/:username").get(verifyJWT,getUserProfile)

userRouter.route("/history").get(verifyJWT,getWatchHistory)

export { userRouter };