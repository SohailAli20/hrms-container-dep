require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

const {
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand
} = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const req = {
        email: requestBody.email,
        password: requestBody.password,
    };
    const reqSchema = z.object({
        email: z.string().email(),
        password: z.string(),
    });
    const valResult = reqSchema.safeParse(req);
    if (!valResult.success) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: valResult.error.formErrors.fieldErrors,
            }),
        };
    }
    const client = await connectToDatabase();
    const cognitoClient = new CognitoIdentityProviderClient({
        region: "us-east-1",
    });

    try {
        const input = {
            UserPoolId: process.env.COGNITO_POOL_ID,
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: req.email,
                PASSWORD: req.password
            }
        };
        const authResponse = await cognitoClient.send(new AdminInitiateAuthCommand(input));
        accessToken = authResponse.AuthenticationResult.AccessToken;
        refreshToken = authResponse.AuthenticationResult.RefreshToken;
        await client.query(`UPDATE employee SET access_token = $1, refresh_token = $2 WHERE work_email = $3`, [accessToken, refreshToken, req.email]);
		const res = await client.query(`SELECT * FROM employee WHERE work_email = $1`, [req.email]);
        const result = res.rows[0];
        const PersonalDetails = {
            id: result.id || "No Data",
            email: result.email|| "No Data",
            work_email: result.work_email|| "No Data",
            first_name: result.first_name|| "No Data",
            last_name: result.last_name|| "No Data",
            gender: result.gender|| "No Data",
            dob: result.dob|| "No Data",
            number: result.number || "No Data",
            emergency_number: result.emergency_number|| "No Data",
            highest_qualification: result.highest_qualification|| "No Data",
            emp_detail_id: result.emp_detail_id|| "No Data",
            description: result.description|| "No Data",
            current_task_id: result.current_task_id|| "No Data",
            invitation_status: result.invitation_status|| "No Data",
            org_id: result.org_id|| "No Data",
            image: result.image|| "No Data",
            email_verified: result.email_verified|| "No Data"
        };
        // let message = "Successfully Signed-In";
        // if (result.email_verified=='NO') {
        //     message += ", but email needs to be verified";
        // }
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                Result: PersonalDetails,
                AccessToken: accessToken,
                RefreshToken: refreshToken
            })
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
    }
};
