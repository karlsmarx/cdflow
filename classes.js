const Resource = class {
	constructor({
		name = "ip",
		addressType = undefined, // INTERNAL or EXTERNAL
		subnetwork = undefined,
	}) {
		this.name = name;

		if (subnetwork) this.subnetwork = subnetwork;
	}
};

const Address = class {
	constructor({
		project,
		region,
		resource,
	}) {
		this.project = project;
		this.region = region;

		if (!(resource instanceof Resource)) throw Error("INVALID_RESOURCE");

		this.resource = resource;
	}
};

const Network = class {
	constructor({
		type = "ONE_TO_ONE_NAT",
		natIP = undefined,
		name,
		network = "global/networks/default",
		networkIP = undefined,
	}) {
		this.accessConfigs = [{
			type,
			name,
		}];

		this.network = network;

		if (natIP) this.accessConfigs[0].natIP = natIP;
		if (networkIP) this.networkIP = networkIP;
	}
};

const VirtualMachine = class {
	constructor({
		os = "container-vm", // To see all OS images in console: gcloud compute images list
		http = true,
		https = true,
		machineType = "f1-micro", // To see all available machine-types: gcloud compute machine-types list
		networks = undefined,
	}) {
		this.os = os;
		this.http = http;
		this.https = https;
		this.machineType = machineType;
		this.networkInterfaces = [];

		if (networks) {
			networks.forEach((network) => {
				if (!(network instanceof Network)) throw Error("INVALID_NETWORK");

				this.networkInterfaces.push(network);
			});
		} else {
			this.networkInterfaces.push({ network: "global/networks/default" });
		}
	}
};

const TriggerTemplate = class {
	constructor({
		projectId,
		repoName,
		branchName, // TODO check regex and interpretate
	}) {
		this.projectId = projectId;
		this.repoName = repoName;
		this.branchName = branchName;
	}
};

const Trigger = class {
	constructor({
		description = "Novo trigger",
		filename = "cloudbuild.yaml", // The name of file to be used in build
		triggerTemplate, // The branch/regex to trigger a build
		substitutions,
	}) {
		this.description = description;
		this.filename = filename;

		if (substitutions) this.substitutions = substitutions;

		if (triggerTemplate instanceof TriggerTemplate) this.triggerTemplate = triggerTemplate;
	}
};

const Role = class {
	constructor({
		description = "Custom role created by @cdf",
		title = "P-flow capacitor",
		stage = "GA",
	}) {
		this.description = description;
		this.title = title;
		this.stage = stage;

		this.includedPermissions = [
			"source.repos.create",
			"source.repos.get",
			"source.repos.list",
			"cloudkms.cryptoKeys.create",
			"cloudkms.cryptoKeys.get",
			"cloudkms.cryptoKeys.list",
			"cloudkms.keyRings.create",
			"cloudkms.keyRings.get",
			"cloudkms.keyRings.list",
			"cloudkms.cryptoKeyVersions.useToDecrypt",
			"cloudkms.cryptoKeyVersions.useToEncrypt",
			"compute.addresses.create",
			"compute.addresses.createInternal",
			"compute.addresses.get",
			"compute.addresses.list",
			"compute.addresses.use",
			"compute.addresses.useInternal",
			"compute.instances.create",
			"compute.instances.get",
			"compute.instances.list",
			"cloudbuild.builds.create",
			"cloudbuild.builds.get",
			"cloudbuild.builds.list",
		];
	}
};

module.exports = {
	Resource,
	Address,
	Network,
	VirtualMachine,
	TriggerTemplate,
	Trigger,
	Role,
};
