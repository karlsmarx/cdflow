const Chance = require("chance");

const chance = new Chance();

const KMS = require("../utils/gcloud_kms.js");
const Classes = require("../classes.js");

const keyFilename = "./demo-key.json";
const JSONFile = require(keyFilename); // eslint-disable-line

// Build and Source API's
const kms = new KMS({
	projectId: JSONFile.project_id,
	keyFilename: "./tests/demo-key.json",
});

module.exports = (expect) => {
	let keyRing;
	it("should create a new keyRing", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const response = await kms.createKeyRing(name, "southamerica-east1");

		expect(response.name.substring(response.name.length - 8)).to.be.equal(name);
		keyRing = response;
		keyRing.name = name;
	});

	let cryptoKey;
	it("should create a key inside keyring", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const response = await kms.createKey(name, keyRing.name, "southamerica-east1");

		cryptoKey = response;
		cryptoKey.name = name;
	});

	it("should encrypt data", async () => {
		const plaintext = await chance.string({ length: 30, pool: "abcdefghijklmno" });
		const response = await kms.encryptData(plaintext, "southamerica-east1", keyRing.name, cryptoKey.name);
	});
};
