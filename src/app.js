import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// use method is used to configure and handle the middleware.
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// set the limit of json except ->
app.use(express.json({ limit: "16kb" }));

// app.use(express.urlencoded()); is also handle url data.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// this is standard that we import routers here not above
// router import
import userRouter from "../src/routes/user.routes.js";

// routes declaration
// app.use("/users", userRouter);
app.use("/api/v1/users", userRouter);

/*
how this route works -> 
http://localhost:8000/users now users will send to userRouter -> userRouter sends to /register it looks like 
http://localhost:8000/users/register.
now in app.js we don't need to change every router we just pass this /users
 -> lets say we have /login so
it will be -> http://localhost:8000/users/login like this.

now, in industry we have an api so mention api and its version ->
http://localhost:8000/api/v1/users/register. 


*/

export { app };
