import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { v2 as cloudinary }
from "cloudinary";
import mongoose from "mongoose";
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

                avatar: avatar.secure_url,
                avatarPublicId: avatar.public_id,

                coverImage: coverImage?.secure_url || "",
                coverImagePublicId: coverImage?.public_id || "",

                email: email.toLowerCase(),
                password,
                username: username.toLowerCase()
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
        $unset:{refreshToken:1}
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
    .json(new ApiResponse(201,"user logged out successfully"))
})

export const refreshAccessToken= asyncHandler(async(req,res)=>{
    try{// storing incomingRefreshToken
    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken
    if (!incomingRefreshToken){
        // throw err
        throw new ApiError(401,"no incomingRefreshToken attached")
    }
    // jwt token verification 
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id)
    if (!user){        
        throw new ApiError(401,"invalid refresh token 1")
    }
    if (incomingRefreshToken !==user.refreshToken){
        throw new ApiError(401,"refresh token either expired or used")
    }
    // make new token as everthing passed if we reached here 
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,refreshToken}= await generateAccessTokenAndRefreshToken(user._id)
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            accessToken,
            refreshToken,
            options
        },"access token refreshed successfully")
    )}
    catch(error){
         console.log(error); ///for debugging did this and 1 , 2 for same only
        throw new ApiError(401,"invalid refresh token 2")
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
    // console.log(req.user)

    return res.status(200)
    .json(new ApiResponse(200,req.user,"Fetched the current user successfully"))
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
.json(new ApiResponse(200,req.user,"account details updated successfully"))
})

export const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
     // Current user
    const currentUser = await User.findById(req.user._id);
    const oldAvatarPublicId = currentUser.avatarPublicId;
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.secure_url){
        throw new ApiError(400,"error while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
                avatar:avatar.secure_url,
                avatarPublicId:avatar.public_id
                }
    },{new:true}).select('-password')
    if (oldAvatarPublicId){
        await cloudinary.uploader.destroy(oldAvatarPublicId)
    }
    return res.status(200)
        .json(new ApiResponse(200,user,"avatar image changed successfully"))
})


export const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const currentUser = await User.findById(req.user._id);
    const oldCoverImagePublicId = currentUser.coverImagePublicId;
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage){
        throw new ApiError(400,"error while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
                coverImage:
                    coverImage.secure_url,
                coverImagePublicId:
                    coverImage.public_id
                }
    },{new:true}).select('-password')

    // Delete old cover image
    if (oldCoverImagePublicId) {
        try {
            await cloudinary.uploader.destroy(
                oldCoverImagePublicId
            );
        } catch (error) {
            console.log(
                "Failed to delete old cover image:",
                error
            );
        }
    }

    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image changed successfully"))
})


export const getUserProfile = asyncHandler(async(req,res)=>{
    const { username } = req.params

    if (!username?.trim()){
        throw new ApiError(
            401,
            "no username found / invalid username"
        )
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in : [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            },
            
        },
        {
        $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                avatar:1,
                coverImage:1,
                email:1
            }}
    ])
    if(!channel?.length){
            throw new ApiError(401,"channel has no such values")
        }
    return res
    .status(200)
    .json(new ApiResponse(200,"user channel fetched successfully"))
})

export const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
            },
        },

    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"watchHistory",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                            $project:{
                                fullname:1,
                                userName:1,
                                avatar:1
                            }
                        }]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"owner",
                        }
                    }
                }
            ]
        }
    },
])
return res.status(200).json(
    new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully")
)
})