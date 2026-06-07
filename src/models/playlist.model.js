import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const { Schema } = mongoose;

const playlistSchema = new Schema({
    name:{
        type: string ,       
        required:true
    },
    description:{
        type: string ,       
        required:true
    },
    comment:{
        type: Schema.Types.ObjectId ,       
        ref:"Comment"
    },
    videos:{
        type: Schema.Types.ObjectId,        
        ref:"Video"
    },
    owner:{
        type: Schema.Types.ObjectId ,       
        ref:"User"
    },
},{timestamps:true});

playlistSchema.plugin(mongooseAggregatePaginate);

const Playlist = mongoose.model("Comment", playlistSchema);

export default Playlist;
