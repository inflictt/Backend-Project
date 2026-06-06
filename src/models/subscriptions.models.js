import { Schema } from "mongoose";
import mongoose  from "mongoose";

const subscriptionsSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},
{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionsSchema)