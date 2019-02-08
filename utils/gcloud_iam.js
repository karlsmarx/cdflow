const { google } = require("googleapis");

const interfaces = require("../classes.js");

module.exports = class {
	constructor(key) {
		this.key = key;
		this.projectId = key.project_id;

		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
		// TODO Refactoring to share JWT and function
	}

	async createServiceAccount(name) {
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

		const decoded = new Buffer(response.data.privateKeyData, "base64").toString("ascii");
		return { name: response.data.name, JSON: decoded };
	}

	async createRole(name, role) {
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
		const response = await google.cloudresourcemanager("v1").projects.setIamPolicy({
			auth: this.JWT,
			resource: `projects/${this.projectId}/`,
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
