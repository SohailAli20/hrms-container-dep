const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event, context, callback) => {
    const id = event.pathParameters.org_id;
    if (!id) {
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({ message: "Missing id in path parameters" })
        };
    }
    let eventData;
    const organisationSchema = z.object({
        name: z.string().refine(value => value.trim().length > 0, {
          message: 'Name is required.',
        }),
        email: z.string().email({ message: 'Invalid email address.' }).default("default@example.com"),
        number: z.string().refine(value => /^(\+\d{1,2}\s?)?(\(\d{3}\)\s?\d{3}(-|\s?)\d{4}|\d{10}(-|\s?)\d{4}|\d{7,11})$/.test(value), {
            message: 'Invalid phone number format. Should be a valid phone number format.',
          }),                  
        logo: z.string().default(""),
        address_id: z.string().refine(value => value.trim().length > 0, {
            message: 'Address ID is required.',
          }).default("").optional(),          
        address_line_1: z.string().default(""),
        address_line_2: z.string().default(""),
        landmark: z.string().default(""),
        country: z.string().refine(value => value.trim().length > 0, {
          message: 'Country is required.',
        }).default("").optional(),
        state: z.string().refine(value => value.trim().length > 0, {
          message: 'State is required.',
        }).default("").optional(),
        city: z.string().refine(value => value.trim().length > 0, {
          message: 'City is required.',
        }).default("").optional(),
        zipcode: z.string().refine(value => /^\d{6}$/.test(value), {
          message: 'Invalid ZIP code format. Should be 6 digits.',
        }).default("").optional(),
      });
    if(eventData!= true) {
        eventData = organisationSchema.parse(JSON.parse(event.body));
    } else  {
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({ message: "Invalid request body format" })
        };
    }
    const client = await connectToDatabase();   
    try {
        const res = await client.query(
            ` UPDATE organisation 
            SET 
               name = $1, 
               email = $2, 
               number = $3, 
               logo = $4, 
               address_id = $5, 
               address_line_1 = $6, 
               address_line_2 = $7, 
               landmark = $8, 
               country = $9, 
               state = $10, 
               city = $11,
               zipcode = $12 
            WHERE id = $13`,
             [
                eventData.name,
                eventData.email,
                eventData.number,
                eventData.logo,
                eventData.address_id,
                eventData.address_line_1,
                eventData.address_line_2,
                eventData.landmark,
                eventData.country,
                eventData.state,
                eventData.city,
                eventData.zipcode,
                id
            ]
        );
        if (res.rowCount === 1) {
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify()
            };
        } else {
            return {
                "statusCode": 404,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify()
            };
        }
    } catch (e) {
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify({ message: e.message })
        };
    } finally {
        await client.end();
    }
};
