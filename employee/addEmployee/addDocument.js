const { connectToDatabase } = require("../../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
	const documents = JSON.parse(event.body);
	const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
	const currentTimestamp = new Date().toISOString();

	const requestBodySchema = z.array(z.object({
        name: z.string(),
        url: z.number().url(),
		emp_id: z.string().uuid()
    }));

    const result = requestBodySchema.safeParse(requestBody);
	if (!result.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: result.error.formErrors.fieldErrors,
			}),
		};
	}

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
	const client = await connectToDatabase();
	await client.query("BEGIN");
	try {
        const insertedDocument = []
		for (const document of documents) {
            const addDocumentQueryResult = await client.query(
                addDocumentQuery,
                [
                    document.name,
                    document.url,
                    document.emp_id
                ]
            );
            const { emp_id, ...insertedDataWithoutEmpId } = addDocumentQueryResult.rows[0];
            insertedDocument.push(insertedDataWithoutEmpId);
        }
		await client.query("COMMIT");
		return {
			statuscode: 200,
			headers: {
				Access_Control_Allow_Origin: "*",
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
				"Access-Control-Allow-Origin": "*",
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
