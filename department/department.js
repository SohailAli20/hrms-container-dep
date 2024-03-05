const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

async function addDepartment(event) {
    try {
        const { name, org_id } = JSON.parse(event.body);

        const DepartmentSchema = z.object({
            name: z.string().min(3, {
                message: "Department name must be at least 3 characters long",
            }),
            org_id: z.string().uuid({ message: "org_id must be a valid UUID" }),
        });

        const departmentData = { name, org_id };

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
            }),
        };
    }
}

async function getDepartment(event) {
    try {
        const client = await connectToDatabase();

        try {
            const query = "SELECT * FROM department";
            const result = await client.query(query);

            const departments = result.rows;

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(departments),
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
            }),
        };
    }
}

async function updateDepartment(event) {
    try {
        const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
        const { name, id } = JSON.parse(event.body);

        const DepartmentSchema = z.object({
            name: z.string().min(3, {
                message: "Department name must be at least 3 characters long",
            }),
            id: z.number().int(),
        });

        const departmentData = { name, id };

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
                [name, org_id, id]
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
            }),
        };
    }
}

exports.handler = async (event) => {
    const path = event.path;
    const method = event.httpMethod;

    switch (`${method}${path}`) {
        case 'POST/department':
            return addDepartment(event);
        case 'GET/department':
            return getDepartment(event);
        case 'PUT/department':
            return updateDepartment(event);
        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Not Found" }),
            };
    }
};
