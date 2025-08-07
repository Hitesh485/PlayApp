import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// const registerUser = asyncHandler(async (req, res) => {
//     res.status(200).json({
//         message: "OK",
//     });
// });


const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save in object
        user.refreshToken = refreshToken;
        // user.save save token in db but it requires mendatory fields also, to prevent this use use ->
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }
    catch(error)
    {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists : username or email or both
    // check for image and avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password } = req.body;
    console.log("email : ", email);
    console.log("username : ", username);
    console.log("fullName : ", fullName);
    console.log("password : ", password);

    /*
    we can check each field like this
    if (fullName === "")
    {
        throw new ApiError(400, "fullname is required");
    }
        OR using array.some()
    */

    // to check fields are not empty ->
    if ([fullName, email, username, password].some((field) => { return field.trim() === ""})) 
    {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists...
    // we have to check both username and email so we need || operator.

    // here User is from db so put await here.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // middleware in route -> with access file same as express give req.body
    // file access may vary ->
    // console this req.files and other things
    // here we are doing chaining.
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // Here we expect that we surely get a path. but if we don't send a coverimage in res this will give error of undefined. in case of avatar image we check below and throw error but not for this so instead of this line.
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    else
    {
        coverImageLocalPath = null;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // check again avatar upload (this time on cloudinary), because avatar is db mendatory field.
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // create entry in db
    // in coverImage need to take care here ->
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // we can check user is created or not
    // .select method takes string, and we specify that WHAT WE DON'T WANT
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "something went wrong while registering a user!!!"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});


const loginUser = asyncHandler(async (req, res) => {
    /*
    req->body = data
    username or email
    find the user
    password check
    access and refresh token
    send cookies
    */

    const {username, email, password} = req.body;

    if (!(username || email)){
        throw new ApiError(400, "username or email is required");
    }

    // find in db acc to email or username
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user){
        throw new ApiError(400, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // send cookies ->
    // httponly and secure -> cookies generally modifiable through frontend but to enable these cookies now only modified through server.

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
});


const logoutUser = asyncHandler(async (req, res) => {
    // now this before logoutUser we init our middleware jwtVerify so we have req.user
    // req.user._id we can get whole Uesr obj from db, and by deletion of token user can logout.

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken){
        throw new ApiError(401, "Unautherized Request");
    }

    // no need for try catch but for safety purpose we are using -

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodeToken._id);
    
        if (!user)
        {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if (incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Refresh token is expired or used");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res 
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, { accessToken, newRefreshToken }, "Access token refreshed successfully")
        )
    } catch (error) { 
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    // this could give some error ->
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {

    
    const { fullName, email } = req.body;

    if (!(fullName || email))
    {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName : fullName,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"))

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    // take file through multer from user.
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url)
    {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    // Assignment -> delete old image from cloudinary.  

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    // take file through multer from user.
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath)
    {
        throw new ApiError(400, "Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url)
    {
        throw new ApiError(400, "Error while uploading on Cover Image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    // params is for url
    const {username} = req.params

    if (!username?.trim())
    {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        },
        {   // first pipeline ->
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" // count of my total subscribers
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo" // me who subscribe other channels
            }
        },
        {
            $addFields : { // add 2 fields in User document
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                }
            },
            isSubscribed: { // send true or false to frontend for button subscribed or subscribe.
                $cond: {
                    $if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    $then: true,
                    $else: false
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    console.log("Channel aggregate ---> ", channel);    

    if (!channel?.length)
    {
        throw new ApiError(404, "channel does not exists");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage,
    getUserChannelProfile
 };
