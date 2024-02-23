const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
    const params = event.queryStringParameters?.name ?? null;
    const nameSchema = z.string({ message: "Invalid employee name" });
    const isName = nameSchema.safeParse(params);
    if (!isName.success) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: isName.error.issues[0].message,
            }),
        };
    }
    const client = await connectToDatabase();

    try {
        const query = `
            SELECT 
                e.*, 
                ed.*, 
                d.name AS department,
                et.type AS emp_type,
                edg.designation,
                ed.start_date
            FROM 
                employee e
            LEFT JOIN 
                emp_detail ed ON e.emp_detail_id = ed.id
            LEFT JOIN 
                department d ON ed.department_id = d.id
            LEFT JOIN 
                emp_type et ON ed.emp_type_id = et.id
            LEFT JOIN 
                emp_designation edg ON ed.designation_id = edg.id
            WHERE
                (e.first_name ILIKE '%' || $1 || '%' OR e.last_name ILIKE '%' || $1 || '%')
        `;

        const res = await client.query(query, [params]);
        const extractedData = res.rows.map((row) => ({
            employee_name: `${row.first_name} ${row.last_name}`,
            employee_id: row.id,
            email_address: row.work_email,
            designation: row.designation,
            employee_type: row.emp_type,
            department: row.department,
            start_date: row.start_date,
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(extractedData),
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
