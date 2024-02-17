const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const queryParametersSchema = z.object({
        page: z.string().regex(/^\d+$/),
        pageSize: z.string().regex(/^\d+$/),
    });

    const { page = 1, pageSize = 10 } = queryParametersSchema.parse(event.queryStringParameters);

    const offset = (page - 1) * pageSize;

    const client = await connectToDatabase();

    try {
        const query = `
            SELECT
                e.id,
                e.first_name,
                e.last_name,
                e.work_email,
                ed.designation,
                et.type AS emp_type,
                d.name AS department,
                ed2.start_date
            FROM
                employee e
            LEFT JOIN emp_designation ed ON e.org_id::uuid = ed.org_id::uuid
            LEFT JOIN emp_type et ON e.org_id::uuid = et.org_id::uuid
            LEFT JOIN department d ON e.org_id::uuid = d.org_id::uuid
            LEFT JOIN emp_detail ed2 ON e.emp_detail_id::uuid = ed2.id::uuid
            WHERE
                e.first_name IS NOT NULL AND
                e.last_name IS NOT NULL AND
                e.id IS NOT NULL AND
                e.work_email IS NOT NULL AND
                ed.designation IS NOT NULL AND
                et.type IS NOT NULL AND
                d.name IS NOT NULL AND
                ed2.start_date IS NOT NULL
            GROUP BY
                e.id, e.first_name, e.last_name, e.work_email, ed.designation, et.type, d.name, ed2.start_date
            ORDER BY e.id
            LIMIT ${pageSize} OFFSET ${offset}
        `;

        const EmployeeMetaData = await client.query(query);
        const resultArray = EmployeeMetaData.rows.map(row => ({
            Employee_Name: `${row.first_name} ${row.last_name}`,
            Employee_Id: row.id,
            Email_Address: row.work_email,
            Designation: row.designation,
            Employee_Type: row.emp_type,
            Depertment: row.department,
            Start_Date: row.start_date
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(resultArray),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: e.message,
                error: e
            }),
        };
    } finally {
        await client.end();
    }
};
