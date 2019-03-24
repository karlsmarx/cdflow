#!/usr/bin/env node

const args = require("args");
const path = require("path");
const fs = require("fs");

const { google } = require("googleapis");

const {
	Iam,
	Source,
	Kms,
	Build,
	Compute,
	ServiceUsage,
	KeyGen,
} = require("./utils"); // eslint-disable-line

const Classes = require("./classes.js");

// Create the args definition for input
args
	.option("api-key", "The API key file")
	.option("build-file", "The build definition JSON", "build.json")
	.option("keep", "Indicates that the generated key should be saved");

const flags = args.parse(process.argv);

// Transform path to absolute to use in multiple calls
const absoluteBuildPath = path.resolve(flags.buildFile);

// Get The json build file
const buildFile = require(absoluteBuildPath); // eslint-disable-line

// Try to get key from args or buildfile
let keyFilename = null;
if (flags.apiKey) {
	keyFilename = path.resolve(flags.apiKey);
} else {
	keyFilename = path.resolve(buildFile.keyFilename); // eslint-disable-line
}

let key = require(keyFilename); // eslint-disable-line
if (!key) throw Error("ERR_NULL_KEY_FILENAME");

// Creates a new Prject and return his data or read the data from keyFile default project
const getProjectData = async () => {
	const JWT = new google.auth.JWT(key.client_email, null, key.private_key, "https://www.googleapis.com/auth/cloud-platform");

	const response = await google.cloudresourcemanager("v1").projects.get({
		auth: JWT,
		projectId: key.project_id,
	});

	return response.data;
};

const servicesToEnable = () => {
	const services = [];

	Object.keys(buildFile).forEach((buildKey) => {
		if (buildKey === "serviceAccount") services.push("iam.googleapis.com");
		if (buildKey === "repository") services.push("sourcerepo.googleapis.com");
		if (buildKey === "triggers") services.push("cloudbuild.googleapis.com");
		if (buildKey === "kms") services.push("cloudkms.googleapis.com");
		if (buildKey === "vm") services.push("compute.googleapis.com");
	});

	return services;
};

const enableServices = async (servicesList) => {
	// Read project from keyFile
	const projectData = await getProjectData();

	const services = new ServiceUsage(key);
	console.log("Enabling services.");

	// try one time and again after 60 seconds to gap with API SLO
	let enabledServices = await services.batchEnable(servicesList, projectData.projectNumber);

	if (!enabledServices.metadata || enabledServices.metadata.resourceNames.length < 4) {
		await new Promise((resolve, reject) => {
			setTimeout(async () => {
				enabledServices = await services.batchEnable(servicesList, projectData.projectNumber);
				if (enabledServices.metadata && enabledServices.metadata.resourceNames.length > 3) resolve(true);

				reject(false); // eslint-disable-line
			}, 60000);
		});
	}

	if (!enabledServices) throw Error("ERR_UNABLE_TO_ENABLE_SERVICES");
	console.log("Services enabled.");

	return enabledServices;
};

const createTriggers = async (triggers, repository) => {
	const build = new Build(key);

	const createdTriggers = [];

	// For each trigger, generate a new trigger build in GCloud
	await Promise.all(triggers.map(async (trigger) => {
		// Instantiate a new trigger clas to guarantee the data
		const newTrigger = new Classes.Trigger({
			description: trigger.description,
			triggerTemplate: new Classes.TriggerTemplate({
				projectId: key.project_id,
				repoName: repository.name,
				branchName: trigger.branchName,
			}),
		});

		// If has substitutions, insert in the trigger
		if (trigger.substitutions) newTrigger.substitutions = trigger.substitutions;

		// Create a new trigger in GCloud a save data to return
		const response = await build.createTrigger(newTrigger);
		console.log(`Trigger {${newTrigger.description}}  created.`);
		createdTriggers.push(response);
	}));

	return createdTriggers;
};

const generateProject = async () => {
	const result = {};

	// Enable API's to use
	const servicesList = await servicesToEnable();
	result.enabledServices = await enableServices(servicesList);

	// Create a service account for admin the used resources in next steps
	if (buildFile.serviceAccount) {
		console.log("Creating service account");
		const iam = new Iam(key);

		const createdAccount = await iam.createServiceAccount(buildFile.serviceAccount.name);
		result.createdAccount = createdAccount;

		const serviceKey = await iam.createServiceKey(createdAccount.uniqueId);
		if (flags.keep) fs.writeFileSync(path.resolve(flags.keep), serviceKey.JSON);

		console.log("Creating service role.");
		const newRole = new Classes.Role({});
		const createdRole = await iam.createRole("CDFlowRole", newRole);

		console.log("Setting up role to service account.");
		await iam.setPolicy(createdRole.name, createdAccount.email);

		console.log("Service account created and configured.");
	}

	// Create a new Cloud Source repository
	const sources = new Source(key);
	const { repository } = buildFile;

	console.log(`Creating the {${repository.name}} repository.`);

	const createdRepository = await sources.createRepository(repository.name);
	result.repository = createdRepository;

	console.log("repository created.");

	// Create triggers for source repository
	console.log("Creating triggers.");

	const createdTriggers = await createTriggers(buildFile.triggers, repository);
	result.triggers = createdTriggers;

	console.log("Triggers created.");

	// If has a kms data, create the new key-ring and crypto-key
	if (buildFile.kms) {
		// Instantiate a new KMS API
		const kms = new Kms({
			projectId: key.project_id,
			keyFilename,
		});

		// Get the data form build-file and creates a keyring and crypto-key
		const kmsData = buildFile.kms;

		console.log("Creating key-ring.");

		const newKeyRing = await kms.createKeyRing(kmsData.keyRing, kmsData.location);
		result.keyRing = newKeyRing;

		console.log(`Key-ring {${kmsData.keyRing}} created.`);
		console.log("Creating crypto-key.");

		const newCryptoKey = await kms.createKey(kmsData.cryptoKey, kmsData.keyRing, kmsData.location);
		result.cryptoKey = newCryptoKey;

		console.log(`Crypto-key {${kmsData.cryptoKey}} created.`);

		// If build file has a true generateSSH option, creates a new ssh_key and ecrypt with kms (TESTING)
		console.log("Generating ssh-key.");
		const keyPair = await KeyGen.generateKeys(key.client_email);

		const encryptedData = await kms.encryptData(keyPair.privateKey, kmsData.location, kmsData.keyRing, kmsData.cryptoKey);

		await fs.writeFileSync(path.resolve("./ssh_key.enc"), encryptedData.ciphertext);
		await fs.writeFileSync(path.resolve("./ssh_key.pub"), keyPair.publicKey);

		result.sshKey = path.resolve("./ssh_key");
		console.log(`ssh-key created and encrypted. Location: ${path.resolve("./ssh-key.enc")}`);
	}

	// Create a new VM
	// TODO promove external ips
	console.log("Creating virtual machine.");

	const compute = new Compute({
		projectId: key.project_id,
		keyFilename,
	});

	const { vm } = buildFile;
	const vmInfo = new Classes.VirtualMachine({
		os: vm.os,
		http: vm.http,
		https: vm.https,
		machineType: vm.machineType,
	});

	const createdVm = await compute.createVM({ name: vm.name, zone: vm.zone, vmInfo });
	result.vm = createdVm;

	let networks;
	if (vm.networks) {
		const vmData = await compute.getVm(vm);
		networks = vmData.metadata.networkInterfaces;

		if (vm.networks.internalIp) {
			const { name } = vm.networks.internalIp;
			const ip = networks[0].networkIP;

			await compute.upgradeAddress({
				name,
				address: ip,
				addressType: "INTERNAL",
			}, "southamerica-east1");

			result.vm.internalIp = ip;
		}

		if (vm.networks.externalIp) {
			const { name } = vm.networks.externalIp;
			const ip = networks[0].accessConfigs.natIP;

			await compute.upgradeAddress({
				name,
				address: ip,
				addressType: "EXTERNAL",
			}, "southamerica-east1");

			result.vm.externalIp = ip;
		}
	}

	console.log(`VM {${vm.name}} created.`);

	console.log("Final Result: SUCCESS.");
	console.log("");

	return result;
};

generateProject()
	.then(result => console.log(result))
	.catch((err) => {
		if (err.message === "Requested entity already exists") {
			if (err.config.url.includes("sourcerepo")) {
				const { name } = JSON.parse(err.config.data);
				const repoName = name.split("/");
				console.log(`Repository { ${repoName[repoName.length - 1]} } already exists in { ${repoName[1]} } project.`);
			}
		} else {
			console.log(err.message);
		}

		console.log("");
	});