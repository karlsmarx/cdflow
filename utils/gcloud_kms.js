// TODO examine all responses to get some interessant returns
const KMS = require("@google-cloud/kms");

module.exports = class {
	constructor({
		projectId,
		keyFilename,
	}) {
		this.keyFilename = keyFilename;
		this.projectId = projectId;
		this.client = new KMS.KeyManagementServiceClient({
			keyFilename: this.keyFilename,
		});
	}

	// Create KeyRings
	async createKeyRing(keyRingId, location) {
		const parent = this.client.locationPath(this.projectId, location);

		const [result] = await this.client.createKeyRing({ parent, keyRingId });
		return result;
	}

	// list all KeyRings
	async listKeyRings(location) {
		const parent = this.client.locationPath(this.projectId, location);
		const [keyRings] = await this.client.listKeyRings({ parent });

		return keyRings;
	}

	// get a specific keyRing
	async getKeyRing(name, location) {
		const keyName = this.client.keyRingPath(this.projectId, location, name);

		const [keyRing] = await this.client.getKeyRing({ name: keyName });
		return keyRing;
	}

	// create a new key
	async createKey(name, keyRing, location, purpose = "ENCRYPT_DECRYPT") {
		const parent = this.client.keyRingPath(this.projectId, location, keyRing);

		const [cryptoKey] = await this.client.createCryptoKey({
			parent,
			cryptoKeyId: name,
			cryptoKey: {
				purpose,
			},
		});

		return cryptoKey;
	}

	// list all keys
	async listKeys(keyRing, location) {
		const parent = this.client.keyRingPath(this.projectId, location, keyRing);

		const [cryptoKeys] = await this.client.listCryptoKeys({ parent });
		return cryptoKeys;
	}

	// get a specific key
	async getKey(name, keyRing, location) {
		const path = this.client.cryptoKeyPath(this.projectId, location, keyRing, name);

		const [cryptoKey] = await this.client.getCryptoKey({ name: path });
		return cryptoKey;
	}

	async encryptData(plaintext, location, keyRing, cryptoKey) {
		const path = this.client.cryptoKeyPathPath(this.projectId, location, keyRing, cryptoKey);

		const response = await this.client.encrypt({ name: path, plaintext });
		return response[0];
	}
};
