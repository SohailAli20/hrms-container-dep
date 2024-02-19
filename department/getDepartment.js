const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {  
    const client = await connectToDatabase();
    try {
        const query = 'SELECT * FROM department';
        const result = await client.query(query);
        
        const departments = result.rows;
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(departments),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: error.message,
                error: error,
            }),
        };
    } finally {
        await client.end();
    }
};
