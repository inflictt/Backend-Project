import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async(userId)=>{
    
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken , refreshToken}

    } catch (error) {
         console.log("REAL ERROR:", error) 
        throw new ApiError(500,"erro while gen new access/refreshToken ")
    }

}

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
            throw new ApiError(400,"Avatar file is required (not received by server)")
        }
        const avatar =  await uploadOnCloudinary(avatarLocalPath)
        const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
        if(!avatar){
            throw new ApiError(400,"Avatar upload to Cloudinary failed")
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
        
export const loginUser = asyncHandler(async(req,res)=>{
    const {email,username,password} = req.body
    if (!(username || email)){
        throw new ApiError(400,"either username / email is requried to login ")
    }

    const user= await User.findOne({
         $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(400,"user doesnt exists")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect")
    }

    const {accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") 

    const options = {
        httpOnly : true,
        secure:true,
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options )
    .cookie("refreshToken",refreshToken,options )
    .json(new ApiResponse(200,{
        user:loggedInUser,
        accessToken,refreshToken
    },"User logged in successfully"))
})

export const logoutUser = asyncHandler(async(req,res)=>{
    await User.findById(req.user._id),{
        $set:{refreshToken:undefined}
    },
    {
        new:true
    }
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(201,"user logged out successfully")
})
