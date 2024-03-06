require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const {CognitoIdentityProviderClient, AdminInitiateAuthCommand} = require("@aws-sdk/client-cognito-identity-provider");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");

const reqSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

exports.handler = middy(async (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const req = {
        email: requestBody.email,
        password: requestBody.password,
    };

    const client = await connectToDatabase();
    const cognitoClient = new CognitoIdentityProviderClient({
        region: "us-east-1",
    });

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
        id: result.id || "",
        email: result.email || "",
        work_email: result.work_email || "",
        first_name: result.first_name || "",
        last_name: result.last_name || "",
        gender: result.gender || "",
        dob: result.dob || "",
        number: result.number || "",
        emergency_number: result.emergency_number || "",
        highest_qualification: result.highest_qualification || "",
        emp_detail_id: result.emp_detail_id || "",
        description: result.description || "",
        current_task_id: result.current_task_id || "",
        invitation_status: result.invitation_status || "",
        org_id: result.org_id || "",
        image: result.image || "",
        email_verified: result.email_verified || ""
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

})
.use(bodyValidator(reqSchema))
.use(errorHandler());
