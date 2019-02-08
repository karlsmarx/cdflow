const { google } = require("googleapis");

module.exports = class {
	constructor(key) {
		this.key = key;
		this.projectId = key.project_id;

		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
	}

	async createRepositorie(name) {
		if (!name) throw Error("INVALID_NAME");

		const response = await google.sourcerepo("v1").projects.repos.create({
			auth: this.JWT,
			parent: `projects/${this.projectId}`,
			requestBody: {
				name: `projects/${this.projectId}/repos/${name}`,
			},
		});

		return response.data;
	}

	async listRepositories() {
		const response = await google.sourcerepo("v1").projects.repos.list({
			auth: this.JWT,
			name: `projects/${this.projectId}`,
		});

		return response.data.repos;
	}

	async getConfig() {
		const response = await google.sourcerepo("v1").projects.getConfig({
			auth: this.JWT,
			name: `projects/${this.projectId}`,
		});

		return response.data;
	}
};
