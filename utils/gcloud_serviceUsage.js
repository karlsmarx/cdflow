const { google } = require("googleapis");

module.exports = class {
	constructor(key) {
		this.key = key;
		this.projectId = key.project_id;

		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
	}

	async enableService(service, projectNumber) {
		const response = await google.serviceusage("v1").services.enable({
			auth: this.JWT,
			name: `projects/${projectNumber}/services/${service}`,
		});

		return response.data;
	}

	async batchEnable(serviceIds = [], projectNumber) {
		const response = await google.serviceusage("v1").services.batchEnable({
			auth: this.JWT,
			parent: `projects/${projectNumber}`,
			requestBody: {
				serviceIds,
			},
		});

		return response.data;
	}
};
