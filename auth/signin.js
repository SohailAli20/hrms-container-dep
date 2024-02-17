require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { v4: uuid } = require("uuid");

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
		const org_id = uuid();
		const input = {
			UserPoolId: process.env.COGNITO_POOL_ID,
            ClientId : process.env.COGNITO_CLIENT_ID,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: req.email,
                PASSWORD: req.password
            }
		};
		const createUserResponse = await cognitoClient.send(
			new AdminInitiateAuthCommand(input)
		);
        return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(createUserResponse)
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
