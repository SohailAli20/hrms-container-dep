const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const { id } = event.pathParameters;
    const { type, org_id } = JSON.parse(event.body);
    const BodySchema = z.object({
        type: z.string().min(3, { message: "Type must be at least 3 characters long" }),
        org_id: z.string().uuid({ message: "org_id must be a valid UUID" }).optional(),
    });
    const validationResult = BodySchema.safeParse({ type, org_id });
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
        await client.connect();
        let query = 'UPDATE emp_type SET type = $1';
        let values = [type];
        if (org_id) {
            query += ', org_id = $2';
            values.push(org_id);
        }
        query += ' WHERE id = $3';
        values.push(id);
        await client.query(query, values);
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Emp_type updated successfully",
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
