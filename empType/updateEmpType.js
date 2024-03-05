const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
    const { type, id } = JSON.parse(event.body);
    const empTypeSchema = z.object({
        type: z.string().min(3, { message: "Type must be at least 3 characters long" }),
        id: z.number().int()
    });
    const empTypeData = {
        type: type,
        id: id
    };    
    const validationResult = empTypeSchema.safeParse(empTypeData);
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
        const result = await client.query(
            `UPDATE emp_type SET type = $1, org_id = $2 WHERE id = $3 RETURNING *`,
            [type, org_id, id]
        );
        if (result.rowCount === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    message: "Emp_type not found",
                }),
            };
        }
        const updatedempType = result.rows[0];
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(updatedempType),
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
