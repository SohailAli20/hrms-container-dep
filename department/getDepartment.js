const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {  
    const FiltersSchema = z.object({
        org_id: z.string().uuid(), 
    });
    const client = await connectToDatabase();
    try {
        const { filters } = event.queryStringParameters;
        let parsedFilters = {};
        if (filters) {
            parsedFilters = FiltersSchema.parse(JSON.parse(filters));
        }
        let query = `SELECT * FROM department`;
        if (Object.keys(parsedFilters).length > 0) {
            const filterClauses = Object.keys(parsedFilters).map((key) => `${key} = '${parsedFilters[key]}'`);
            query += ` WHERE ${filterClauses.join(' AND ')}`;
        }
        const result = await client.query(query);
        const departments = result.rows;
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(departments),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message,
            }),
        };
    }
};
