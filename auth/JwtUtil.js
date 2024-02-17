const jwt = require("jsonwebtoken");

const SECRET_KEY = "SECRET_KEY";
const AUDIENCE = "www.synectiks-workflow.com";
const ISSUER = "www.synectiks.com";

function generateAccessToken(claims, userId) {
	return jwt.sign(
		{
			aud: AUDIENCE,
			iss: ISSUER,
			sub: userId,
			iat: Math.floor(Date.now() / 1000), //UNIX current timestamp
			exp: Math.floor(Date.now() / 1000) + 20, //7 days expiration
			claims: claims,
		},
		SECRET_KEY,
		{ algorithm: "HS256" }
	);
}

function validateToken(token) {
	try {
		const decodedJwt = jwt.verify(token, SECRET_KEY);
		if (decodedJwt.aud != AUDIENCE || decodedJwt.iss != ISSUER) {
			return {
				statusCode: 403,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Invalid access token"
				}),
			};
		}
	} catch (err) {
		console.log(err);
		return {
			statusCode: 403,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: err.message,
				error: err,
			}),
		};
	}
}
const extraClaims = {
	orgId: "",
	email: "",
	role: "",
};

// function generateRefreshToken(extraClaims, userDetails) {
//     return jwt.sign({
//         sub: userDetails.username,
//         iat: Math.floor(Date.now() / 1000),
//         exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 day expiration
//     }, SECRET_KEY);
// }

module.exports = {
    generateAccessToken,
    validateToken
};