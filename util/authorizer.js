const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const cognitoIssuer = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_POOL_ID}`;

const client = jwksClient({
	jwksUri: `${cognitoIssuer}/.well-known/jwks.json`,
});

async function validateToken(token, kid) {
	const key = await client.getSigningKey(kid);
	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			key.getPublicKey(),
			{ issuer: cognitoIssuer },
			(err, decoded) => {
				if (err) {
					reject(err);
				} else {
					resolve(decoded);
				}
			}
		);
	});
}

exports.authorize = () => ({
	before: async (handler, next) => {
		const { event } = handler;
		const authHeader =
			event.headers.Authorization || event.headers.authorization;
		if (!authHeader) {
			throw new AuthorizationError("no authorization header provided");
		}
		if (!authHeader.startsWith("Bearer ")) {
			throw new AuthorizationError("invalid authorization header format");
		}
		const token = authHeader.substring(7);
		const decodedToken = jwt.decode(token, { complete: true, json: true });
		const userData = await validateToken(token, decodedTokenq.header.kid);
		event.user = userData;
		next();
	},
});

const AuthorizationError = (message) => {
	const error = new Error(message);
	error.name = "AuthorizationError";
	if (typeof Error.captureStackTrace === "function") {
		Error.captureStackTrace(error, AuthorizationError);
	} else {
		error.stack = new Error().stack;
	}
	return error;
};
