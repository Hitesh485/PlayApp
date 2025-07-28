// here api error handling, by inherit the error class and create customize error for ease.

class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "")
    {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack)
        {
            this.stack = stack;
        }
        else
        {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};
