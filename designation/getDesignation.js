const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {  
    const client = await connectToDatabase();
    try {
        const query = 'SELECT * FROM emp_designation';
        const result = await client.query(query);
        
        const emp_designation = result.rows;
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(emp_designation),
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
