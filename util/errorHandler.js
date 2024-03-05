exports.errorHandler = () => ({
    onError: (handler, next) => {
        handler.response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: handler.error.message,
                error:  handler.error,
            }),
        }
        next();
    }
 });