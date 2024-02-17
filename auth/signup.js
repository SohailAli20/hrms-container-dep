equire("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { v4: uuid } = require("uuid");

const {
	CognitoIdentityProviderClient,
	AdminCreateUserCommand,
	AdminAddUserToGroupCommand,
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
			Username: req.email,
			TemporaryPassword: req.password,
			UserAttributes: [
				{
					Name: "custom:org_id",
					Value: org_id,
				},
			],
			// MessageAction: "RESEND"
		};
		const createUserResponse = await cognitoClient.send(
			new AdminCreateUserCommand(input)
		);
		console.log(JSON.stringify(" .. . .. .. ", createUserResponse));
		const addUserToGroupParams = {
			GroupName: "Admin",
			Username : req.email,
			UserPoolId: process.env.COGNITO_POOL_ID,
		};
		const addUserToGroupResponse = await cognitoClient.send(
			new AdminAddUserToGroupCommand(addUserToGroupParams)
		);
		console.log(JSON.stringify(addUserToGroupResponse));
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
