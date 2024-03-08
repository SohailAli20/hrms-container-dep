require("dotenv").config();
const { Client } = require("pg");

async function connectToDatabase() {
	try {
		const client = new Client({
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			database: "workflow",
			user: process.env.DB_USER,
			password: process.env.DB_PASSOWRD,
		});
		console.log(JSON.stringify(client));
		await client.connect();
		return client;
	} catch (error) {
		console.log("database :" + error.message);
	}
}

module.exports = {
	connectToDatabase,
};
