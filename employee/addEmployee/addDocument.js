const { connectToDatabase } = require("../../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
	const requestBody = JSON.parse(event.body);
	console.log(requestBody)
	const requestBodySchema = z.object({
        emp_id: z.string().uuid({
			message : "invalid employee id"
		}),
        documents: z.array(z.object({
			name: z.string(),
			url:  z.string().url(),
		})),
    });
	console.log("1")
    const result = requestBodySchema.safeParse(requestBody);
	if (!result.success) {
		return {
			statusCode: 400,
			headers: {
				'Access-Control-Allow-Origin': '*',
      			'Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify({
				error: result.error.formErrors.fieldErrors,
			}),
		};
	}
	console.log("2")
	const addDocumentQuery = {
                name: "add-document",
        		text: `
                        INSERT INTO document
                            (name, url, emp_id)
                         VALUES
                            ($1, $2, $3) 
                        RETURNING *
                    `,
	};
	console.log("3")
	const client = await connectToDatabase();
	console.log("4")
	console.log(requestBody)
	await client.query("BEGIN");
	try {
        const insertedDocument = []
		for (const document of requestBody.documents) {
            const addDocumentQueryResult = await client.query(
                addDocumentQuery,
                [
                    document.name,
                    document.url,
                    requestBody.emp_id
                ]
            );
            const { emp_id, ...insertedDataWithoutEmpId } = addDocumentQueryResult.rows[0];
            insertedDocument.push(insertedDataWithoutEmpId);
        }
		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
      			'Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify(
				insertedDocument
                ),
		};
	} catch (error) {
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
      			'Access-Control-Allow-Credentials': true,
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	} finally {
		await client.end();
	}
};
