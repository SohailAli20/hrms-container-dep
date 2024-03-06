require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

const {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");

const idSchema = z.object({
    id: z.string().uuid({ message: "Invalid employee id" })
});

exports.handler = middy(async (event, context, callback) => {

    const employeeId = event.pathParameters?.id ?? null;

    const cognitoClient = new CognitoIdentityProviderClient({
        region: "us-east-1",
    });

    const empDetailsQuery = `SELECT work_email, org_id 
                             FROM employee 
                             WHERE id = $1;`;

    const updateInvitationStatus = `UPDATE employee SET 
                                    invitation_status  = $1
                                    WHERE id = $2
                                    returning invitation_status ;`;

    const client = await connectToDatabase();

    const empDetailsResult = await client.query(empDetailsQuery, [employeeId]);
    const org_id = empDetailsResult.rows[0].org_id;
    const work_email = empDetailsResult.rows[0].work_email;

    const input = {
        UserPoolId: process.env.COGNITO_POOL_ID,
        Username: work_email,
        UserAttributes: [
            {
                Name: "custom:org_id",
                Value: org_id,
            },
            {
                Name: "custom:user_id",
                Value: work_email,
            },
            {
                Name: "custom:role",
                Value: "user",
            }
        ],
    };

    let status;

    await cognitoClient.send(new AdminCreateUserCommand(input))
        .then(createUserResponse => {
            if (createUserResponse.$metadata.httpStatusCode === 200) {
                const addUserToGroupParams = {
                    GroupName: "User",
                    Username: work_email,
                    UserPoolId: process.env.COGNITO_POOL_ID,
                };

                return cognitoClient.send(new AdminAddUserToGroupCommand(addUserToGroupParams));
            } else {
                throw new Error("Failed to create user");
            }
        })
        .then(addUserToGroupResponse => {

            if (addUserToGroupResponse.$metadata.httpStatusCode === 200) {

                return client.query(updateInvitationStatus, ["SENT", employeeId]);
            } else {
                throw new Error("Failed to add user to group");
            }
        })
        .then(result => {
            status = result;
        })
        .catch(error => {
            throw error;
        });

    if (status.rowCount === 1) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: "Successfully Signed-up" })
        };
    } else {
        throw new Error("Failed to update invitation status");
    }

})
.use(pathParamsValidator(idSchema))
.use(errorHandler());
