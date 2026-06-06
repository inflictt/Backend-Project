import mongoose  from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
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
    type:String,
    required:true
    },
    avatarPublicId:{
        type:String,
        required:true
    },
    coverImage:{
        type:String
    },
    coverImagePublicId:{
        type:String
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
    type:String,
    required:[true,"Password is required!"]
},
    refreshToken:{
        type:String,
    },
},{timestamps:true})

// hash password before saving (only when it's new/changed)
userSchema.pre("save",async function name() {
    if (!this.isModified("password")) return
    this.password =await bcrypt.hash(this.password,10)
})
// password check return true false
userSchema.methods.isPasswordCorrect =async function name(password) {
    return await bcrypt.compare(password,this.password)
}

// generate short-lived JWT with user info (sent to client, not stored in DB)
userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
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

// generate long-lived JWT with only _id (saved to DB by controller for re-login)
userSchema.methods.generateRefreshToken=function(){
return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

const User = mongoose.model("User", userSchema);

export default User;