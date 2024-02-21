const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const page = event.queryStringParameters?.page ?? null
    let offset = (page - 1) * 10;
    offset = Math.max(offset, 0);
    const client = await connectToDatabase();
    console.log(offset)
    try {
        const query = `
                SELECT
                    e.id,
                    e.first_name,
                    e.last_name,
                    e.work_email,
                    ed.designation,
                    ed2.employee_id,
                    et.type AS emp_type,
                    d.name AS department,
                    ed2.start_date
                FROM
                    employee e
                LEFT JOIN emp_detail ed2 ON e.emp_detail_id = ed2.id
                LEFT JOIN emp_designation ed ON ed2.designation_id = ed.id
                LEFT JOIN emp_type et ON ed2.emp_type_id = et.id
                LEFT JOIN department d ON ed2.department_id = d.id
                ORDER BY e.first_name 
                LIMIT 10 OFFSET ${offset}
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
