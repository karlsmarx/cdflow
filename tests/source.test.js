const fs = require("fs");
const Chance = require("chance");

const chance = new Chance();

const SOURCE = require("../utils/gcloud_source.js");
const Classes = require("../classes.js");

const keyFilename = "./demo-key.json";
const JSONFile = require(keyFilename); // eslint-disable-line

// SOURCE API's
const source = new SOURCE(JSONFile);

module.exports = (expect) => {
	let repositorie;
	it("should create a new repository", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const response = await source.createRepositorie(name);

		expect(response.name.substring(response.name.length - 8)).to.be.equal(name);
		repositorie = response;
	});

	it("should list repositories", async () => {
		const response = await source.listRepositories();
	});

	it("should get repositories config", async () => {
		const response = await source.getConfig();

		expect(response.name).to.be.equal(`projects/${JSONFile.project_id}`);
	});
};
