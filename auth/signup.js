const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { v4: uuid } = require("uuid");
const nodemailer = require("nodemailer");
const {
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
    AdminCreateUserCommand,
    RespondToAuthChallengeCommand,
	AdminDeleteUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "chetankumar6609@gmail.com",
        pass: "tdyw zade oqvr pxyv"
    }
});

exports.handler = async (event, context) => {
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
        const org_id = uuid();
        const user_id = uuid();
        const input = {
            UserPoolId: process.env.COGNITO_POOL_ID,
            Username: req.email,
            TemporaryPassword: req.password,
            UserAttributes: [
                {
                    Name: "custom:org_id",
                    Value: org_id,
                },
                {
                    Name: "custom:user_id",
                    Value: user_id,
                }
            ],
            MessageAction: "SUPPRESS"
        };
        const createUserResponse = await cognitoClient.send(new AdminCreateUserCommand(input));
			const inputAuth = {
				UserPoolId: process.env.COGNITO_POOL_ID,
				ClientId: process.env.COGNITO_CLIENT_ID,
				AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
				AuthParameters: {
					USERNAME: req.email,
					PASSWORD: req.password
				}
			};
			const authResponse = await cognitoClient.send(new AdminInitiateAuthCommand(inputAuth));
			console.log("authResponse",authResponse);
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
			const accessToken = newPasswordResponse ? newPasswordResponse.AuthenticationResult.AccessToken : authResponse.AuthenticationResult.AccessToken;
            const RefreshToken = newPasswordResponse.AuthenticationResult.RefreshToken;
			const verificationLink = ` https://bwppdwpoab.execute-api.us-east-1.amazonaws.com/dev/verify?email_id=${req.email}`;

            await transporter.sendMail({
                from: "chetankumar6609@gmail.com",
                to: req.email,
                subject: 'Email Verification',
                text: `Please click the link to verify your email: ${verificationLink}`
            });
            
			await client.query("BEGIN");
			const res1 = await client.query(`INSERT INTO organisation(id) VALUES ($1)`,[org_id]);
			const res2 = await client.query(`INSERT INTO employee (id , work_email, invitation_status,org_id,email_verified,access_token,refresh_token) VALUES ($1,$2, 'SENT',$3,'NO',$4,$5)`, [user_id,req.email,org_id,accessToken,RefreshToken]);
			await client.query("COMMIT");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ Message: "Successfully Signed-up",AccessToken : accessToken})
        };
    } catch (error) {
        console.error("Error signing up user:", error);
        await client.query("ROLLBACK");
        const params = {
            UserPoolId: process.env.COGNITO_POOL_ID,
            Username: req.email,
        };
       await cognitoClient.send(new AdminDeleteUserCommand(params));
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
