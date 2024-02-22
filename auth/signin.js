require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const nodemailer = require("nodemailer");

const {
	CognitoIdentityProviderClient,
	AdminInitiateAuthCommand
	
} = require("@aws-sdk/client-cognito-identity-provider");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "chetankumar6609@gmail.com",
        pass: "tdyw zade oqvr pxyv"
    }
});


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
		const res = await client.query(`SELECT * from employee where work_email = $1`,[req.email]);
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
            ClientId : process.env.COGNITO_CLIENT_ID,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: req.email,
                PASSWORD: req.password
            }
		};
		const authResponse = await cognitoClient.send(
			new AdminInitiateAuthCommand(input)
		);
        if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({message:"Change Password"})
			};
            
			//const accessToken = newPasswordResponse ? newPasswordResponse.AuthenticationResult.AccessToken : authResponse.AuthenticationResult.AccessToken;
			//const RefreshToken = newPasswordResponse.AuthenticationResult.RefreshToken;
			// const verificationCodeInput = {
			//     AccessToken: accessToken,
			//     AttributeName: 'email'
			// };
			// const verificationCodeResponse = await cognitoClient.send(
			//     new GetUserAttributeVerificationCodeCommand(verificationCodeInput)
			// );
			// console.log("verificationCodeResponse",verificationCodeResponse);
			// const verificationCode = verificationCodeResponse.CodeParameter;
			
	    }else if(result.email_verified=="NO"){
			const accessToken =  authResponse.AuthenticationResult.AccessToken;
			const RefreshToken =  authResponse.AuthenticationResult.RefreshToken;
			await client.query(`update employee set access_token = $1 , refresh_token = $2 where work_email = $3`,[accessToken,RefreshToken,req.email]);
			const verificationLink = ` https://bwppdwpoab.execute-api.us-east-1.amazonaws.com/dev/verify?email_id=${req.email}`;
			await transporter.sendMail({
				from: "chetankumar6609@gmail.com",
				to: req.email,
				subject: 'Email Verification',
				text: `Please click the link to verify your email: ${verificationLink}`
			});
        return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({message:"Successfully logged In and verification link sent",result:PersonalDetails, AccessToken : authResponse.AuthenticationResult.AccessToken,
			                   RefreshToken:authResponse.AuthenticationResult.RefreshToken})
		};
	}else if (result.email_verified=="YES"){
		    const accessToken =  authResponse.AuthenticationResult.AccessToken;
			const RefreshToken =  authResponse.AuthenticationResult.RefreshToken;
			await client.query(`update employee set access_token = $1 , refresh_token = $2 where work_email = $3`,[accessToken,RefreshToken,req.email]);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({message:"Successfully logged In",result:PersonalDetails,AccessToken : authResponse.AuthenticationResult.AccessToken,
			                 RefreshToken:authResponse.AuthenticationResult.RefreshToken })
		};

	}
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