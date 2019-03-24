const COMPUTE = require("@google-cloud/compute");
const { google } = require("googleapis");

const interfaces = require("../classes.js");

module.exports = class {
	constructor({
		projectId,
		keyFilename,
	}) {
		this.keyFilename = keyFilename;
		this.projectId = projectId;

		this.compute = new COMPUTE({
			projectId: this.projectId,
			keyFilename: this.keyFilename,
		});

		const key = require(keyFilename); // eslint-disable-line
		this.JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");
	}

	// GCloud address methods
	async createAddress(address) {
		if (!(address instanceof interfaces.Address)) throw Error("INVALID_ADDRESS");

		const result = await google.compute("v1").addresses.insert({ auth: this.JWT, ...address });

		return result.data;
	}

	async listAddress(region) {
		const result = await google.compute("v1").addresses.list({
			auth: this.JWT,
			project: this.projectId,
			region,
		});

		return {
			region,
			project: this.projectId,
			data: result.data,
		};
	}

	async getAddress(addressName, region) {
		const result = await google.compute("v1").addresses.get({
			auth: this.JWT,
			address: addressName,
			project: this.projectId,
			region,
		});

		return result.data;
	}

	async upgradeAddress(address, region) {
		const result = await google.compute("v1").addresses.insert({
			auth: this.JWT,
			project: this.projectId,
			region,
			requestBody: { ...address },
		});

		if (result.statusText !== "OK") throw Error("ERR_UPGRADE_IP");

		return true;
	}

	// Statical IP's need to be created manually
	async createVM({
		zone = "southamerica-east1-a",
		name = "docker-01",
		vmInfo,
	}) {
		if (!(vmInfo instanceof interfaces.VirtualMachine)) throw Error("INVALID_VM");
		// To get the list of available zones in console: gcloud compute zones list
		const vmZone = this.compute.zone(zone);

		const [vm, operation] = await vmZone.createVM(name, vmInfo); // To see all OS images in console: gcloud compute images list
		const operationResult = await operation.promise();

		const result = {
			id: vm.id,
			name: vm.name,
			url: vm.url,
			operation: {
				id: operationResult[0].id,
				name: operationResult[0].name,
				user: operationResult[0].user,
				targetLink: operationResult[0].targetLink,
			},
		};

		return result;
	}

	// TODO make external ips from vm static

	async getVm(vm) {
		const foundVm = await google.compute("v1").instances.get({
			auth: this.JWT,
			instance: vm.name,
			project: this.projectId,
			zone: vm.zone,
		});

		const {
			id,
			creationTimestamp,
			status,
			zone,
			networkInterfaces,
			disks,
			selfLink,
		} = foundVm.data;

		const info = {
			id: foundVm.data.id,
			name: foundVm.data.name,
			url: foundVm.url,
			metadata: {
				id,
				creationTimestamp,
				status,
				zone,
				networkInterfaces,
				disks,
				selfLink,
			},
		};

		return info;
	}

	async listVMs() {
		const vms = await this.compute.getVMs();

		const result = [];
		vms.forEach((vm) => {
			vm.forEach((insideVm) => {
				console.log(insideVm.metadata.networkInterfaces);
				const {
					id, creationTimestamp, status, zone, networkInterfaces, disks, selfLink,
				} = insideVm.metadata;

				const info = {
					id: insideVm.id,
					name: insideVm.name,
					url: insideVm.url,
					metadata: {
						id, creationTimestamp, status, zone, networkInterfaces, disks, selfLink,
					},
				};

				result.push(info);
			});
		});

		return result;
	}

	// List of available regions
	async listRegions() {
		const regions = await this.compute.getRegions();

		const infos = [];
		regions.forEach((region) => {
			region.forEach((insideRegion) => {
				const {
					id, kind, creationTimestamp, status, zones, selfLink,
				} = insideRegion.metadata;

				const info = {
					id: insideRegion.id,
					name: insideRegion.name,
					metadata: {
						id, kind, creationTimestamp, status, zones, selfLink,
					},
				};

				infos.push(info);
			});
		});

		return infos;
	}

	// List of available zones
	async listZones() {
		const zones = await this.compute.getZones();

		const infos = [];
		zones.forEach((zone) => {
			zone.forEach((insideZone) => {
				const {
					id, kind, creationTimestamp, status, region, selfLink, availableCpuPlatforms,
				} = insideZone.metadata;

				const info = {
					id: insideZone.id,
					name: insideZone.name,
					metadata: {
						id, kind, creationTimestamp, status, region, selfLink, availableCpuPlatforms,
					},
				};

				infos.push(info);
			});
		});

		return infos;
	}

	// TODO region/zone quotas regions[0][0].metadata.quotas
};
