import {v2 as cloudinary} from "cloudinary";
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDAINARY_NAME,
    api_key: process.env.CLOUDAINARY_API_KEY,
    api_secret: process.env.CLOUDAINARY_API_SECERT
}); 

export default cloudinary;