import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const { Schema } = mongoose;

const tweetSchema = new Schema({

    owner:{
       type: Schema.Types.ObjectId ,       
        ref:"User"
    },
    content:{
        type: string ,       
        required:true
    },
},{timestamps:true});

tweetSchema.plugin(mongooseAggregatePaginate);

const Tweet = mongoose.model("Comment", tweetSchema);

export default Tweet;
