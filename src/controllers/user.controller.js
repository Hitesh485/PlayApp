import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = asyncHandler(async (req, res) => {
//     res.status(200).json({
//         message: "OK",
//     });
// });

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

export { registerUser };
