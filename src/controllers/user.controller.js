import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
export const registerUser =
    asyncHandler(async (req, res) => {

        const {fullname, username,email,password} = req.body
        if ([
            fullname, username,email,password
        ].some((field)=>field?.trim()==="")){
            throw new ApiError(400,"Field should be filled properly")
        }
        // validate user
        const existingUser =await User.findOne(
            {
                $or:[{username},{email}]
            }
        )
        if (existingUser){
            throw new ApiError(409,"User already in db")
        }
        const avatarLocalPath = req.files?.avatar?.[0]?.path//given by multer and first prop picked 
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path
        if (!avatarLocalPath){
            throw new ApiError(400,"Avatar is required ")
        }
        const avatar =  await uploadOnCloudinary(avatarLocalPath)
        const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
        if(!avatar){
            throw new ApiError(400,"Avatar is required ")
        }
        
        // entry in db
        const user = await User.create({
            fullname,
            avatar:avatar.secure_url,//avatar.url,//just path req
            coverImage:coverImage?.url||"",
            email:email.toLowerCase(),
            password,
            username:username.toLowerCase()
        })
        // if (!user) {
        //     throw new ApiError(
        //         500,
        //         "User registration failed"
        //     ); or can be done by _id
        //}       
        const createdUser  = await User.findById(user._id).select("-password -refreshToken" )
        if (!createdUser) {
            throw new ApiError(
                500,
                "something went wrong while creating a user"
            ); 
        }   
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        ))
    });
        