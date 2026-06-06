import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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

export const refreshAccessToken= asyncHandler(async(req,res)=>{
    try{// storing incomingRefreshToken
    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken
    if (!incomingRefreshToken){
        // throw err
        throw new ApiError(401,"no incomingRefreshToken attached")
    }
    // jwt token verification 
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id)
    if (!user){
        throw new ApiError(401,"invalid refresh token")
    }
    if (incomingRefreshToken !==decodedToken){
        throw new ApiError(401,"refresh token either expired or used")
    }
    // make new token as everthing passed if we reached here 
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newRefreshToken}= await generateAccessTokenAndRefreshToken(user._id)
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(200,{
            accessToken,
            refreshToken:newRefreshToken,
            options
        },"access token refreshed successfully")
    )}
    catch(error){
        throw new ApiError(401,"invalid refresh token")
    }
})


export const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) //method reused 
    if (!isPasswordCorrect){
        throw new ApiError(401,"old password is incorrect")
    }
    //  till here if we reached everything is fine then 
    user.password = newPassword
    await user.save
    ({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password has been changed successfully"))
})


export const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"Fetched the current user successfully")
})
export const updateAccountDetails  = asyncHandler(async(req,res)=>{

    const {fullname,email} =req.body 
    if ([fullname, email].some(field => !field?.trim())){
        throw new ApiError(400,"Both fullname and email are required to update")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            email
        }
    },{new:true}
).select("-password")
return res.status(200)
.json(200,{},"account details updated successfully")
})

export const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url){
        throw new ApiError(400,"error while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select('-password')
 return res.status(200)
    .json(new ApiResponse(200,user,"avatar image changed successfully"))
})


export const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImageLocalPath.url){
        throw new ApiError(400,"error while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select('-password')
    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image changed successfully"))
})