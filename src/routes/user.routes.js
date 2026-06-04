import { Router } from "express";

import {
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
export { userRouter };