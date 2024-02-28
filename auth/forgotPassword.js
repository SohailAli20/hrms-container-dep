require("dotenv").config();
const { z } = require("zod");
const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");
exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const req = {
        email: requestBody.email
    };
    const reqSchema = z.object({
        email: z.string().email()
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

    const client = new CognitoIdentityProviderClient({ region: "us-east-1" }); 
    const input = {
        ClientId: process.env.COGNITO_CLIENT_ID, 
        Username: req.email,
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
