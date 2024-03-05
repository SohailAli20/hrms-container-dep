const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const { type, org_id } = JSON.parse(event.body);
    const Emp_typeSchema = z.object({
        type: z.string().min(3, { message: "Department name must be at least 3 characters long" }),
        org_id: z.string().uuid({ message: "org_id must be a valid UUID" })
    });
    const emp_typeData = {
        type: type,
        org_id: org_id
    };
    const validationResult = Emp_typeSchema.safeParse(emp_typeData);
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
        const query = 'INSERT INTO emp_type (type, org_id) VALUES ($1, $2)RETURNING *';
        const values = [type, org_id];
        const result = await client.query(query, values);
        const insertedEmpType = result.rows[0];
        return {
            statusCode: 201,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(insertedEmpType),
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