import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            requried: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true, // enable for searching.
        },
        email: {
            type: String,
            requried: true,
            lowercase: true,
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // cloudinary url
            requried: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is requried"],
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

// why use normal function here? -> callback fun does't have "this" ref.
// why async here ? -> bcrypt takes time to encrypt password.
userSchema.pre("save", async function (next) {
    // this will update password only when password field coming.
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// no need to async because it will generate fast but it's up to you.
// both are jwt tokens

// here we using normal function because we want _id which is a part of mongodb, and we can access through this keyword, and arrow fun have't support this keyword.
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            // 1. payload ->
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        // 2. now we have to give access token->
        process.env.ACCESS_TOKEN_SECRET,
        // 3. expiry -> which put in object
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            // 1. payload ->
            _id: this._id,
        },
        // 2. now we have to give access token->
        process.env.REFRESH_TOKEN_SECRET,
        // 3. expiry -> which put in object
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
