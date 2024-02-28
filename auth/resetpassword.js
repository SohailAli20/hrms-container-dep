require("dotenv").config();
const { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const username = requestBody.email;
    const confirmationCode = requestBody.otp.trim();
    const newPassword = requestBody.newPassword;

    const client = new CognitoIdentityProviderClient({ region: "us-east-1" }); 
    const input = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: username,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
    };

    try {
        const command = new ConfirmForgotPasswordCommand(input);
        await client.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Password confirmed successfully" }),
        };
    } catch (error) {
        console.error("Error confirming password:", error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Error confirming password",
                error: error.message,
            }),
        };
    }
};
