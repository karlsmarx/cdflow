const { generateKeyPair } = require("crypto");

const keyPair = async () => new Promise((resolve, reject) => {
	generateKeyPair("rsa", {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
			cipher: "aes-256-cbc",
			passphrase: "top secret",
		},
	}, async (err, publicKey, privateKey) => {
		if (err) reject(err);

		resolve({ publicKey, privateKey });
	});
});

module.exports.generateKeys = async (email) => {
	const generatedKeys = await keyPair();

	// Add the comment email to key
	if (email) {
		const privateLines = generatedKeys.privateKey.split("\n");
		const commentedLine = `${privateLines[privateLines.length - 3]} ${email}`;
		privateLines[privateLines.length - 3] = commentedLine;

		generatedKeys.privateKey = privateLines.join("\n");
	}

	return generatedKeys;
};
