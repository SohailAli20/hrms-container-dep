const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

async function addEmpType(event) {
    try {
        const { type, org_id } = JSON.parse(event.body);

        const EmpTypeSchema = z.object({
            type: z.string().min(3, {
                message: "Type must be at least 3 characters long",
            }),
            org_id: z.string().uuid({ message: "org_id must be a valid UUID" }),
        });

        const empTypeData = { type, org_id };

        const validationResult = EmpTypeSchema.safeParse(empTypeData);

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
                `INSERT INTO emp_type (type, org_id) VALUES ($1, $2) RETURNING *`,
                [type, org_id]
            );

            const insertedEmpType = result.rows[0];

            return {
                statusCode: 201,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(insertedEmpType),
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
                error: "Internal Server Error",
            }),
        };
    }
}

async function getEmpType(event) {
    try {
        const client = await connectToDatabase();

        try {
            const query = 'SELECT * FROM emp_type';
            const result = await client.query(query);

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    data: result.rows,
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
                error: "Internal Server Error",
            }),
        };
    }
}

async function updateEmpType(event) {
    try {
        const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
        const { type, id } = JSON.parse(event.body);

        const EmpTypeSchema = z.object({
            type: z.string().min(3, {
                message: "Type must be at least 3 characters long",
            }),
            id: z.number().int(),
        });

        const empTypeData = { type, id };

        const validationResult = EmpTypeSchema.safeParse(empTypeData);

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

            const updatedEmpType = result.rows[0];

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(updatedEmpType),
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
                error: "Internal Server Error",
            }),
        };
    }
}

exports.handler = async (event) => {
    const path = event.path;
    const method = event.httpMethod;

    switch (`${method}${path}`) {
        case 'POST/empType':
            return addEmpType(event);
        case 'GET/empType':
            return getEmpType(event);
        case 'PUT/empType':
            return updateEmpType(event);
        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Not Found" }),
            };
    }
};