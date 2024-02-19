const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const queryParams = event.queryStringParameters || {};
    const QuerySchema = z.object({
        org_id: z.string().uuid({ message: "org_id must be a valid UUID" }).optional(),
    });
    const validationResult = QuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: validationResult.error.errors,
            }),
        };
    }
    const client = await connectToDatabase();
    try {
        let query = 'SELECT * FROM emp_type';
        let values = [];
        if (queryParams.org_id) {
            query += ' WHERE org_id = $1';
            values.push(queryParams.org_id);
        }
        const result = await client.query(query, values);
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
