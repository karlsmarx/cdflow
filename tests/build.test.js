const fs = require("fs");
const Chance = require("chance");
const chance = new Chance();

const BUILD = require("../gcloud_build.js");
const SOURCE = require("../gcloud_source.js");
const Classes = require("../classes.js");

const keyFilename = "./demo-key.json";
const JSONFile = require(keyFilename);

// Build and Source API's
const build = new BUILD(JSONFile);
const source = new SOURCE(JSONFile);

module.exports = (expect) => {
	let repositorie;
	it("should create a new repository", async () => {
		const name = await chance.string({ length: 8, pool: "abcdefghijklmno" });
		const response = await source.createRepositorie(name);

		expect(response.name.substring(response.name.length - 8)).to.be.equal(name);
		repositorie = response;
	});

	it("should create a new trigger", async () => {
		const newTrigger = new Classes.Trigger({
			description: "Teste trigger",
			triggerTemplate: new Classes.TriggerTemplate({
				projectId: JSONFile.project_id,
				repoName: repositorie.name,
				branchName: "master",
			}),
		});

		const response = await build.createTrigger(newTrigger);
		expect(response.triggerTemplate).to.be.equal(newTrigger.triggerTemplate);
	});
};
