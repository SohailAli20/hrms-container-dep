const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {  
    const org_id = '482d8374-fca3-43ff-a638-02c8a425c492';
    const client = await connectToDatabase();
    try {
        const query = `
                        SELECT 
                            id, designation
                        FROM
                             emp_designation
                        WHERE
                            org_id = $1::uuid`;
        const result = await client.query(query, [org_id]);
        if(result.rowCount > 0){
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(result.rows),
            };
        }else{
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify([]),
            };
        }
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
