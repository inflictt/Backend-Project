import mongoose,{Schema}  from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JsonWebTokenError } from "jsonwebtoken";
const userSchema = new mongoose.Schema(
    {
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    }, 
    fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url 
        required:true,
    },
    coverimage:{
        type:String,
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        password:[true,"Password is reqired!"]
    },
    refreshToken:{
        type:String,
    },
},{timestamps:true})

userSchema.pre("save",async function name(next) {
    if (!this.isModified("password")) return next()
    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect =async function name(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    jwt.sign({
        _id:this.id,
        email:this.email,
        username:this.username,
        fullname:this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}


userSchema.methods.generateRefreshToken=function(){
jwt.sign({
        _id:this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema)