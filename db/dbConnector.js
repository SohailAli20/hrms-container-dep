require("dotenv").config();
const { Client } = require("pg");

async function connectToDatabase() {
	try {
		const client = new Client({
			host: process.env.HOST,
			port: process.env.PORT,
			database: "workflow",
			user: process.env.USER,
			password: process.env.PASSOWRD,
		});
		await client.connect();
		return client;
	} catch (error) {
		console.log("database :" + error.message);
	}
}

module.exports = {
	connectToDatabase,
};
