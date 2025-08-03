import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async (req, res, next) here res is empty or no use so, in production grade code we replace res with '_'

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // req.cookies.accessToken added in login fun in user.controller.js
        // ? || Ternary operator used because accessToken not in mobile apps.
        // In postman in headers section we sent key as Autherization and value as "Bearer <space><token>"
        // we replace this Bearer <space> with "" because we only want token not Bearer in string.
        const token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer ", "");
    
        if (!token)
        {
            throw new ApiError(401, "Unautherized request");
        }
    
        // concept of jwt verify token -> read docs
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // in user.models we have generateAccessToken where we have _id field.
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user)
        {
            // TODO: Discuss about frontend
            throw new ApiError(401, "Invalid access token");
        }
        
        // here we add object (req.user) in req.body
        req.user = user;
        next();
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token" );
    }

})