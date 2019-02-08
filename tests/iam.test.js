const fs = require("fs");
const Chance = require("chance");

const chance = new Chance();

const IAM = require("../utils/gcloud_iam.js");
const Classes = require("../classes.js");

const keyFilename = "./demo-key.json";
const JSONFile = require(keyFilename); //eslint-disable-line

// IAM API's
const iam = new IAM(JSONFile);

module.exports = (expect) => {
	let serviceAccount;
	it("should create a service account", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const response = await iam.createServiceAccount(name);

		expect(response.email.substring(0, 8)).to.be.equal(name);
		serviceAccount = response;
	});

	it("should create and storage a new key for service account", async () => {
		const response = await iam.createServiceKey(serviceAccount.uniqueId);

		expect(JSON.parse(response.JSON).client_email).to.be.equal(serviceAccount.email);
		fs.writeFileSync("./cdf_api_key.json", response.JSON);
	});

	let customRole;
	it("should create the p-flow role", async () => {
		const role = new Classes.Role({});
		const roleId = await chance.string({ length: 15, pool: "abcdefghijklmno" });
		const response = await iam.createRole(roleId, role);

		expect(response.name.substring(response.name.length - 15)).to.be.equal(roleId);
		customRole = response;
		customRole.roleId = roleId;
	});

	it("should set the new role to created user", async () => {
		const response = await iam.setPolicy(`roles/${customRole.roleId}`, serviceAccount.email);

		console.log(response);
	});
};
