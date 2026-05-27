import dotenv from "dotenv"
dotenv.config()
import { app } from "./app.js";
// require ('dotenv').config({path:'./.env'})
import mongoose from "mongoose";
import { connectDB } from "./db/index.js";

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server running at port ${process.env.PORT}`);
        
    })
})
.catch((error)=>{
    console.log("MongoDb conn failed",error);
    
})


// -// Approach 1 conn to DB using index.js as a complete file 
    // ;(async()=>{
    //     try{
    //         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    //         app.on("error",(error)=>{
    //             console.log("Error in connecting with app: ",error);
    //             throw error
    //         })
    //         app.listen(process.env.PORT,()=>{
    //             console.log(`App listening on port : ${process.env.PORT}`);
                
    //         })
    //     }
    //     catch(error){
    //         console.log("ERRORR: ",error );
    //         throw error
    //     }
    // }
// )()