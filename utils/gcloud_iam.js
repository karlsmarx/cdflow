const { google } = require("googleapis");

const interfaces = require("../classes.js");

module.exports = class {
	constructor(key) {
		this.key = key;
		this.projectId = key.project_id;

		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
	}

	async createServiceAccount(name) {
		if (name.length < 6 || name.length > 30) throw Error("ERR_NAME_LENGTH");
		if (!(/^[a-z][a-z\d\-]*[a-z\d]/g).test(name)) throw Error("ERR_NAME_CHARS");

		const response = await google.iam("v1").projects.serviceAccounts.create({
			auth: this.JWT,
			name: `projects/${this.projectId}`,
			requestBody: {
				accountId: name,
				serviceAccount: {
					displayName: name,
				},
			},
		});

		return response.data;
	}

	async createServiceKey(account) {
		const response = await google.iam("v1").projects.serviceAccounts.keys.create({
			auth: this.JWT,
			name: `projects/${this.projectId}/serviceAccounts/${account}`,
		});

		const decoded = Buffer.from(response.data.privateKeyData, "base64").toString("ascii");
		return { name: response.data.name, JSON: decoded };
	}

	async createRole(name, role) {
		if (!(/^[a-zA-Z0-9_\.]{3,64}$/g).test(name)) throw Error("ERR_INVALID_ROLE_NAME");

		const response = await google.iam("v1").projects.roles.create({
			auth: this.JWT,
			parent: `projects/${this.projectId}`,
			requestBody: {
				roleId: name,
				role,
			},
		});

		return response.data;
	}

	async setPolicy(role, member) {
		const response = await google.iam("v1").projects.serviceAccounts.setIamPolicy({
			auth: this.JWT,
			resource: `projects/${this.projectId}/serviceAccounts/${member}`,
			requestBody: {
				policy: {
					bindings: [{
						role,
						members: [`serviceAccount:${member}`],
					}],
				},
			},
		});

		return response.data;
	}
};
