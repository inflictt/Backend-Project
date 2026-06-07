import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const { Schema } = mongoose;

const likeSchema = new Schema({
    video:{
        type: Schema.Types.ObjectId ,       
        ref:"Video"
    },
    comment:{
        type: Schema.Types.ObjectId ,       
        ref:"Comment"
    },
    likedBy:{
        type: Schema.Types.ObjectId,        
        ref:"User"
    },
    tweet:{
        type: Schema.Types.ObjectId ,       
        ref:"Tweet"
    },
},{timestamps:true});

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model("Comment", likeSchema);

export default Like;
