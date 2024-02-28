const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");
require("dotenv").config();
exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const username = requestBody.email;

    const client = new CognitoIdentityProviderClient({ region: "us-east-1" }); 
    const input = {
        ClientId: process.env.COGNITO_CLIENT_ID, 
        Username: username,
    };

    try {
        const command = new ForgotPasswordCommand(input);
        const response = await client.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Password reset code sent successfully"
            }),
        };
    } catch (error) {
        console.error("Error sending password reset code:", error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Error sending password reset code",
                error: error.message,
            }),
        };
    }
};
