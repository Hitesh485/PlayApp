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

export { app };
