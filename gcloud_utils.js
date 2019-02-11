#!/usr/bin/env node

const args = require("args");
const path = require("path");
const fs = require("fs");
const exec = require("await-exec");
const chalkAnimation = require("chalk-animation");
const utf8 = require("utf8");

const { google } = require("googleapis");

const {	Source,	Kms, Build,	Compute, ServiceUsage, KeyGen } = require("./utils"); // eslint-disable-line

const Classes = require("./classes.js");

// Style for logs
const normalLog = message => console.log("\x1b[37m", message);
const successLog = message => console.log("\x1b[32m", message);
const warningLog = message => console.log("\x1b[33m", message);
const errorLog = message => console.log("\x1b[31m", message);

// Create the args definition for input
args
	.option("build-file", "The build definition JSON", "build.json")
	.option("api-key", "The API key file", null);

// TODO use a temporary account
// .option("keep", "Indicates that the generated key should be saved", false)

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

const key = require(keyFilename); // eslint-disable-line
if (!key) throw Error("ERR_NULL_KEY_FILENAME");

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
		if (buildKey === "repositorie") services.push("sourcerepo.googleapis.com");
		if (buildKey === "triggers") services.push("cloudbuild.googleapis.com");
		if (buildKey === "kms") services.push("cloudkms.googleapis.com");
		if (buildKey === "vm") services.push("compute.googleapis.com");

		// TODO activate IAM for use temporary servicce account
	});

	return services;
};

const createTriggers = async (triggers, repositorie) => {
	const build = new Build(key);

	const createdTriggers = [];

	// For each trigger, generate a new trigger build in GCloud
	await Promise.all(triggers.map(async (trigger) => {
		// Instantiate a new trigger clas to guarantee the data
		const newTrigger = new Classes.Trigger({
			description: trigger.description,
			triggerTemplate: new Classes.TriggerTemplate({
				projectId: key.project_id,
				repoName: repositorie.name,
				branchName: trigger.branchName,
			}),
		});

		// If has substitutions, insert in the trigger
		if (trigger.substitutions) newTrigger.substitutions = trigger.substitutions;

		// Create a new trigger in GCloud a save data to return
		const response = await build.createTrigger(newTrigger);
		successLog(`Trigger {${newTrigger.description}}  created.`);
		createdTriggers.push(response);
	}));

	return createdTriggers;
};

const generateProject = async () => {
	const result = {};

	// Get project data with number
	const projectData = await getProjectData();

	// Enable API's to use
	const servicesList = await servicesToEnable();

	const services = new ServiceUsage(key);
	normalLog("Enabling services.");
	const animation = chalkAnimation.glitch("Waiting for GCloud response...");

	// try one time and again after 90 seconds
	// TODO animate console waiting
	let enabledServices = await services.batchEnable([servicesList], projectData.projectNumber);

	if (!enabledServices.metadata || enabledServices.metadata.resourceNames.length < 4) {
		await new Promise((resolve, reject) => {
			setTimeout(async () => {
				enabledServices = await services.batchEnable([servicesList], projectData.projectNumber);
				console.log(enabledServices);
				if (enabledServices.metadata.resourceNames.length > 3) resolve(true);

				reject(false); // eslint-disable-line
			}, 30000);
		});
	}

	if (!enabledServices) throw Error("ERR_UNABLE_TO_ENABLE_SERVICES");

	result.enabledServices = enabledServices;
	animation.stop();
	successLog("Services enabled.");

	// Create a new Cloud Source repositorie
	const sources = new Source(key);
	const { repositorie } = buildFile;

	normalLog(`Creating the {${repositorie.name}} repositorie.`);
	animation.start();

	const createdRepositorie = await sources.createRepositorie(repositorie.name);
	result.repositorie = createdRepositorie;

	animation.stop();
	successLog("Repositorie created.");

	// Create triggers for source repositorie
	normalLog("Creating triggers.");
	animation.start();

	const createdTriggers = await createTriggers(buildFile.triggers, repositorie);
	result.triggers = createdTriggers;

	animation.stop();
	successLog("Triggers created.");

	// If has a kms data, create the new key-ring and crypto-key
	if (buildFile.kms) {
		// Instantiate a new KMS API
		const kms = new Kms({
			projectId: key.project_id,
			keyFilename,
		});

		// Get the data form build-file and creates a keyring and crypto-key
		const kmsData = buildFile.kms;

		normalLog("Creating key-ring.");
		animation.start();

		const newKeyRing = await kms.createKeyRing(kmsData.keyRing, kmsData.location);
		result.keyRing = newKeyRing;

		animation.stop();
		successLog(`Key-ring {${kmsData.keyRing}} created.`);

		normalLog("Creating crypto-key.");
		animation.start();

		const newCryptoKey = await kms.createKey(kmsData.cryptoKey, kmsData.keyRing, kmsData.location);
		result.cryptoKey = newCryptoKey;

		animation.stop();
		successLog(`Crypto-key {${kmsData.cryptoKey}} created.`);

		// If build file has a true generateSSH option, creates a new ssh_key and ecrypt with kms (TESTING)
		normalLog("Generating ssh-key.");
		const keyPair = await KeyGen.generateKeys(key.client_email);

		const encryptedData = await kms.encryptData(keyPair.privateKey, kmsData.location, kmsData.keyRing, kmsData.cryptoKey);
		console.log(encryptedData);

		await fs.writeFileSync(path.resolve("./ssh_key.enc"), encryptedData.ciphertext);
		await fs.writeFileSync(path.resolve("./ssh_key.pub"), keyPair.publicKey);

		result.sshKey = path.resolve("./ssh_key");
		successLog(`ssh-key created and encrypted. Location: ${path.resolve("./ssh-key.enc")}`);
	}

	// Create a new VM
	// TODO promove internal and external ips
	normalLog("Creating virtual machine.");
	animation.start();

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

	animation.stop();
	successLog(`VM {${vm.name}} created.`);

	successLog("Final Result: SUCCESS.");
	normalLog("");

	return result;
};

generateProject()
	.then(result => normalLog(result))
	.catch((err) => {
		if (err.message === "Requested entity already exists") {
			if (err.config.url.includes("sourcerepo")) {
				const { name } = JSON.parse(err.config.data);
				const repoName = name.split("/");
				errorLog(`Repository { ${repoName[repoName.length - 1]} } already exists in { ${repoName[1]} } project.`);
			}
		}

		console.log(err);

		normalLog("");
	});
