const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const {
	CognitoIdentityProviderClient,
	RespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const reqSchema = z.object({
	email: z.string(),
	password: z.string(),
});

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
});

exports.handler = async (event, context) => {
	const requestBody = JSON.parse(event.body);
	const req = {
		email: requestBody.email,
		password: requestBody.password,
	};

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

	try {
		const authChallengeInput = {
			ChallengeName: "NEW_PASSWORD_REQUIRED",
			ClientId: process.env.COGNITO_CLIENT_ID,
			ChallengeResponses: {
				USERNAME: req.email,
				NEW_PASSWORD: newPassword,
			},
			Session: authResponse.Session,
		};
		newPasswordResponse = await cognitoClient.send(
			new RespondToAuthChallengeCommand(authChallengeInput)
		);
        console.log(JSON.stringify(newPasswordResponse));
		const accessToken = newPasswordResponse
			? newPasswordResponse.AuthenticationResult.AccessToken
			: authResponse.AuthenticationResult.AccessToken;
		const RefreshToken =
			newPasswordResponse.AuthenticationResult.RefreshToken;

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Successfully Signed-up",
				AccessToken: accessToken,
			}),
		};
	} catch (error) {
		console.error("Error signing up user:", error);
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
