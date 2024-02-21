const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const departmentId = event.pathParameters.id;
    const { name, org_id } = JSON.parse(event.body);
    const DepartmentSchema = z.object({
        name: z.string().min(3, { message: "Department name must be at least 3 characters long" }),
        org_id: z.string().uuid() 
    });
    const departmentData = {
        name: name,
        org_id: org_id
    };
    const validationResult = DepartmentSchema.safeParse(departmentData);
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
            `UPDATE department SET name = $1, org_id = $2 WHERE id = $3 RETURNING *`,
            [name, org_id, departmentId]
        );
        if (result.rowCount === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    message: "Department not found",
                }),
            };
        }
        const updatedDepartment = result.rows[0];
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(updatedDepartment),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message,
            }),
        };
    } finally {
        await client.end();
    }
};
