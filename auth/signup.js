require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { v4: uuid } = require("uuid");
const {
	CognitoIdentityProviderClient,
	SignUpCommand,
	AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");

const org_id = uuid();
const user_id = uuid();

const reqSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
});

exports.handler = middy(async (event, context) => {
	const requestBody = JSON.parse(event.body);
	const req = {
		email: requestBody.email,
		password: requestBody.password,
	};
	const client = await connectToDatabase();

	const result = await client.query(
		`SELECT COUNT(work_email)FROM employee WHERE work_email = $1`,
		[req.email]
	);
	if (result.rows[0].count > 0) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "user account already exists" }),
		};
	}
    	const input = {
		ClientId: process.env.COGNITO_CLIENT_ID,
		Username: req.email,
		Password: req.password,
		UserAttributes: [
			{
				Name: "custom:org_id",
				Value: org_id,
			},
			{
				Name: "custom:user_id",
				Value: user_id,
			},
			{
				Name: "custom:role",
				Value: "admin",
			},
		],
		DesiredDeliveryMediums: "EMAIL",
		MessageAction: "RESEND",
	};

	try {
		const command = new SignUpCommand(input);
		const signupResponse = await cognitoClient.send(command);
		await client.query("BEGIN");
		await client.query(
			`INSERT INTO organisation(id) VALUES ($1)`,
			[org_id]
		);
		await client.query(`
                    INSERT INTO employee(
                        id ,
                        work_email,
                        invitation_status,
                        org_id,
                        email_verified
                    ) VALUES ($1, $2,'SENT', $3, 'NO')`,
			[user_id, req.email, org_id]
		);
		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ Message: "successfully signed up" }),
		};
	} catch (error) {
		await client.query("ROLLBACK");
		const params = {
			UserPoolId: process.env.COGNITO_POOL_ID,
			Username: req.email,
		};
		await cognitoClient.send(new AdminDeleteUserCommand(params));
		throw error;
	}
})
	.use(bodyValidator(reqSchema))
	.use(errorHandler());
