exports.corsMiddleware = () => ({
    after: (handler, next) => {

        handler.response = {
            ...handler.response,
            headers: {
                ...handler.response.headers,
                'Access-Control-Allow-Origin': '*', // Allow requests from any origin
            }
        };
        return next();
    },
});
