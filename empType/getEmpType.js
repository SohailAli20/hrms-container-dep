const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
    const client = await connectToDatabase();
    try {
        const query = 'SELECT * FROM emp_type';
        const result = await client.query(query);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                data: result.rows,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: "Internal Server Error",
            }),
        };
    } finally {
        await client.end();
    }
};
