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
				id: operationResult.id,
				name: operationResult.name,
				type: operationResult.type,
				user: operationResult.user,
				targetLink: operationResult.targetLink,
			},
		};

		return result;
	}

	// TODO make internal and external ips from vm static

	async listVMs() {
		const vms = await this.compute.getVMs();

		const result = [];
		vms.forEach((vm) => {
			vm.forEach((insideVm) => {
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

	// List VM addresses i think
	async listVMAddress() {
		const addresses = await this.compute.getAddresses();

		const infos = [];
		addresses.forEach((address) => {
			address.forEach((insideAddress) => {
				const {
					id, kind, creationTimestamp, name, address, status, addressType,
				} = insideAddress.metadata;

				const info = {
					id: insideAddress.id,
					name: insideAddress.name,
					metadata: {
						id, kind, creationTimestamp, name, address, status, addressType,
					},
				};

				infos.push(info);
			});
		});

		return infos;
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
