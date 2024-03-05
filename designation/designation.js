const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

async function getDesignations(event) {
    try {
        const client = await connectToDatabase();
        const org_id = '482d8374-fca3-43ff-a638-02c8a425c492';
        try {
            const query = `
                SELECT 
                    id, designation
                FROM
                    emp_designation
                WHERE
                    org_id = $1::uuid`;
            const result = await client.query(query, [org_id]);

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(result.rows),
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
    }
}

exports.handler = async (event) => {
    const path = event.path;
    const method = event.httpMethod;

    switch (`${method}:${path}`) {
        case 'GET:/designation':
            return getDesignations(event);
        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Not Found" }),
            };
    }
};
