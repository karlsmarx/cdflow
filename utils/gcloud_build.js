const { google } = require("googleapis");

const interfaces = require("../classes.js");

module.exports = class {
	constructor(key) {
		this.key = key;
		this.projectId = key.project_id;

		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
	}

	async createTrigger(trigger) {
		if (!(trigger instanceof interfaces.Trigger)) throw Error("INVALID_TRIGGER");

		const response = await google.cloudbuild("v1").projects.triggers.create({
			auth: this.JWT,
			projectId: this.projectId,
			requestBody: trigger,
		});

		return response.data;
	}

	async listTriggers() {
		const response = await google.cloudbuild("v1").projects.triggers.list({ auth: this.JWT, projectId: this.projectId });
		return response.data.triggers;
	}

	async listBuilds() {
		const response = await google.cloudbuild("v1").projects.builds.list({ auth: this.JWT, projectId: this.projectId });
		return response.data.builds;
	}
};
