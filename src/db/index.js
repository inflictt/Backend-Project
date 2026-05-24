import mongoose from "mongoose";
import { DB_NAME } from "../constan ts.js";
export const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Mongodb connection success");
        console.log(`with host : ${connectionInstance.connection.host}`);
        
    }
    catch(error){
        console.log("Error in connection",error);
        process.exit(1)
    }
}