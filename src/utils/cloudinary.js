// importing cloudinary v2 SDK
// used for uploading files/images/videos to cloudinary
import { v2 as cloudinary } from "cloudinary";

// fs = file system module
// used for deleting temporary local files
import fs from "fs";


// configuring cloudinary using environment variables
// these credentials connect backend to your cloudinary account
cloudinary.config({

    // cloudinary cloud name
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

    // cloudinary api key
    api_key: process.env.CLOUDINARY_API_KEY,

    // cloudinary secret key
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// utility function for uploading files to cloudinary
const uploadOnCloudinary = async (localFilePath) => {

    try {

        // if file path not received
        // return null immediately
        if (!localFilePath) return null;


        // uploading file to cloudinary
        const response =
            await cloudinary.uploader.upload(
                localFilePath,

                {
                    // automatically detects:
                    // image / video / raw file
                    resource_type: "auto",
                }
            );


        // upload success message
        console.log(
            "File uploaded successfully:",
            response.url
        );


        // remove temporary local file
        // after successful upload
        if (fs.existsSync(localFilePath)) {

            fs.unlinkSync(localFilePath);

        }


        // returning full cloudinary response
        return response;

    } catch (error) {


        // if upload failed
        // remove temp local file
        if (fs.existsSync(localFilePath)) {

            fs.unlinkSync(localFilePath);

        }


        // log upload error
        console.log(
            "Cloudinary upload failed:",
            error
        );


        // returning null on failure
        return null;
    }
};


// exporting function so it can be used
// inside controllers/routes
export default uploadOnCloudinary;