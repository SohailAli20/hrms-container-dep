const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

const {
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
    RespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const req = {
        email: requestBody.email,
        password: requestBody.password,
    };
    const reqSchema = z.object({
        email: z.string(),
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
        const res = await client.query(`SELECT * FROM employee WHERE work_email = $1`, [req.email]);
        const result = res.rows[0];
        const PersonalDetails = {
            id: result.id,
            email: result.email,
            work_email: result.work_email,
            first_name: result.first_name,
            last_name: result.last_name,
            gender: result.gender,
            dob: result.dob,
            number: result.number,
            emergency_number: result.emergency_number,
            highest_qualification: result.highest_qualification,
            emp_detail_id: result.emp_detail_id,
            description: result.description,
            current_task_id: result.current_task_id,
            invitation_status: result.invitation_status,
            org_id: result.org_id,
            image: result.image,
            email_verified: result.email_verified
        };
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

        if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            const newPassword = req.password;
            const respondToAuthChallengeInput = {
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                ClientId: process.env.COGNITO_CLIENT_ID,
                ChallengeResponses: {
                    USERNAME: req.email,
                    NEW_PASSWORD: newPassword
                },
                Session: authResponse.Session
            };
            newPasswordResponse = await cognitoClient.send(
                new RespondToAuthChallengeCommand(respondToAuthChallengeInput)
            );
            console.log(newPasswordResponse);
        }

        let accessToken = null;
        let refreshToken = null;

        if (authResponse.AuthenticationResult) {
            accessToken = authResponse.AuthenticationResult.AccessToken;
            refreshToken = authResponse.AuthenticationResult.RefreshToken;
        } else if (newPasswordResponse.AuthenticationResult) {
            accessToken = newPasswordResponse.AuthenticationResult.AccessToken;
            refreshToken = newPasswordResponse.AuthenticationResult.RefreshToken;
        }

        await client.query(`UPDATE employee SET access_token = $1, refresh_token = $2 WHERE work_email = $3`, [accessToken, refreshToken, req.email]);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Successfully logged In",
                result: PersonalDetails,
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
