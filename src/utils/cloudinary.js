import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been uploading successfully
        console.log("File is uploaded on cloudinary", response.url);
        return response;
    } catch (error) {
        // means-> file is uploaded locally but maybe corrupted or something else that's why it comes in catch so unlike or remove the file locally as upload operation failed and in a sync way not in async.
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export { uploadOnCloudinary };
