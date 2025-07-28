// promise ->
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
    };
};

export { asyncHandler };

// const asyncHandler = () => {};
// // higher order function in js
// const asyncHandler = (func) => () => {};
// // it look like this ->
// // const asyncHandler = (func) => {() => {}}
// // now can create async
// const asyncHandler = (func) => async() => {};

// try catch ->
// const asyncHandler = (fun) => async (req, res, next) => {
//     try {
//         await(req, res, next)
//     }
//     catch (error)
//     {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
