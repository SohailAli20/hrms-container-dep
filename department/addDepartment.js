const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {    
    const { name, org_id } = JSON.parse(event.body);
    const DepartmentSchema = z.object({
        name: z.string().min(3, { message: "Department name must be at least 3 characters long" }),
        org_id: z.string().uuid({ message: "org_id must be a valid UUID" }) 
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
            `INSERT INTO department (name, org_id) VALUES ($1, $2) RETURNING *`,
            [name, org_id]
        );
        const insertedDepartment = result.rows[0];
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(insertedDepartment),
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
