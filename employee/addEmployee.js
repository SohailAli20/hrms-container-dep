const { connectToDatabase } = require("../db/dbConnector")

exports.handler = async (event) => {
    const { emp_type , org_details, personal_information, professtional_information, Equipment_details, Document, created_by } = JSON.parse(event.body);

    const client = await connectToDatabase();
    await client.query("BEGIN");
    try {
        const currentTimestamp = new Date().toISOString();
        const addressResult = client.query(`INSERT INTO address 
            (address_line_1, address_line_2, landmark, country, state ,city,zipcode )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            returning id`,
            [
                personal_information.address_line_1,
                personal_information.address_line_2,
                personal_information.land_mark,
                personal_information.countary,
                personal_information.state,
                personal_information.city,
                personal_information.zip_code

            ]);

        const addressId = addressResult.rows[0];

        const orgResult = client.query(`INSERT INTO organisation 
            (name, email, number, logo, address_id )
            VALUES ($1,$2,$3,$4,$5)
            returning id`,
            [
                org_details.name,
                org_details.email,
                org_details.number,
                org_details.logo,
                addressId

            ]);

        const orgId = orgResult.rows[0];

        const emp_typeResult = client.query(`INSERT INTO emp_type
            (type, org_id)
            VALUES ($1, $2)
            returning id`,
            [emp_type, orgId]);
            
        const emp_typeId = emp_typeResult.rows[0];

        const emp_designationResult = client.query(`INSERT INTO emp_designation
            (designation, org_id)
            VALUES ($1, $2)
            returning id`,
            [
                professtional_information.designation,
                orgId
            ]);
            
        const emp_designationId = emp_designationResult.rows[0];

        const emp_departmentResult = client.query(`INSERT INTO department
            (name, org_id)
            VALUES ($1, $2)
            returning id`,
            [
                professtional_information.department,
                orgId
            ]);

        const emp_departmentId = emp_departmentResult.rows[0];
            
        const employeeDetailResult = client.query(`INSERT INTO emp_detail
            (designation_id, pf, uan , department_id, reporting_manager_id , emp_type_id, work_location, employee_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            returning id`,
            [   
                emp_designationId,
                professtional_information.pf,
                professtional_information.una,
                emp_departmentId,
                professtional_information.reporting_manager_id,
                emp_typeId,
                professtional_information.work_location,
                personal_information.employee_id
            ]);
            
        const employeeDetailId = employeeDetailResult.rows[0];
        
        const employeeResult = client.query(`INSERT INTO employee
            (first_name, last_name , email, work_email , gender, number, emergency_number, highest_qualification, dob, address_id, emp_detail_id, created_at, created_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            returning id`,
            [
                personal_information.first_name,
                personal_information.last_name,
                personal_information.email,
                personal_information.work_email,
                personal_information.gender,
                personal_information.number,
                personal_information.emergency_number,
                personal_information.highest_qualification,
                personal_information.dob,
                addressId,
                employeeDetailId,
                currentTimestamp,
                created_by
            ]);
            
        const employeeId = employeeResult.rows[0];

        // Equipment_details.forEach(equipment => {

        //     const device_typeResult = client.query(`INSERT INTO device_type
        //     (name)
        //     VALUES ($1)
        //     returning id`,
        //     [equipment.device_type]);
            
        // return emp_departmentId = emp_departmentResult.rows[0];
            
        // });
        
        return {
            statuscode: 200,
            headers: {
                "Access_Control_Allow_Origin": "*"
            },
            body: JSON.stringify({Employeeid: employeeId})
        }
    } catch (error) {
        await client.query("ROLLBACK");
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: error.message,
                error: error,
            })
        };
    } finally {

    }
}