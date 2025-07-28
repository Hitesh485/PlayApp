// require("dotenv").config();
// or we can import like this but this still in dev stage, so manually config path and after that go to package.json under sripts-> dev: add "-r dotenv/config --experimental-json-modules".
import dotenv from "dotenv";
import connectDB from "./db/index.js";


// dotenv.config({
//     path: './env',
// })

connectDB();















/* 1st approach 
import express from "express";

const app = express();

// ()() in js it used to call fun immediately
// create fun asyn because db connection establish
// ; at first is nothing but a readability, because is before that line ; is not present is may cause some error nothing else.


;( aync () => {
    try
    {
        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        // check if express not able to communicate with mongo
        app.on("error", (error) => {
            console.log("Error express can't connect: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on ${process.env.PORT}`);
        })
    }
    catch(error)
    {
        console.log("Error: ", error);
        throw error;
    }
})()
*/