const fs = require("fs");
const Chance = require("chance");

const chance = new Chance();

const COMPUTE = require("../utils/gcloud_compute.js");
const Classes = require("../classes.js");

const keyFilename = "./demo-key.json";
const JSONFile = require(keyFilename); // eslint-disable-line

// Compute API's
const compute = new COMPUTE({
	projectId: JSONFile.project_id,
	keyFilename: "./tests/demo-key.json",
});

module.exports = (expect) => {
	const internalIp = {};
	it("should create a new internal address", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const newResource = new Classes.Resource({ name, addressType: "INTERNAL" });
		const newAddress = new Classes.Address({ project: JSONFile.project_id, region: "southamerica-east1", resource: newResource });

		const response = await compute.createAddress(newAddress);
		internalIp.name = name;
	});

	it("should get internal address", async () => {
		const response = await compute.getAddress(internalIp.name, "southamerica-east1");
		internalIp.address = response.address;
	});

	const externalIp = {};
	it("should create a new external address", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const newResource = new Classes.Resource({ name });
		const newAddress = new Classes.Address({ project: JSONFile.project_id, region: "southamerica-east1", resource: newResource });

		const response = await compute.createAddress(newAddress);
		externalIp.name = name;
	});

	it("should get external address", async () => {
		const response = await compute.getAddress(externalIp.name, "southamerica-east1");
	});

	it("should create a new VM", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const newNetwork = new Classes.Network({ name, networkIP: internalIp.address, network: `projects/${JSONFile.project_id}/global/networks/default` });
		const vmInfo = new Classes.VirtualMachine({ networks: [newNetwork] });

		const response = await compute.createVM({ name, vmInfo });
		console.log(response);
	});
};
