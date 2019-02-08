const chai = require("chai");
chai.use(require("chai-as-promised"));

const { expect } = chai;

const iamTests = require("./iam.test.js");
const sourceTests = require("./source.test.js");
const buildTests = require("./build.test.js");
const kmsTests = require("./kms.test.js");
const vmTests = require("./vm.test.js");

/* eslint-disable */
describe("Testes do capacitor de fluxo", function () {
	this.timeout(50000);

	describe("IAM tests", () => {
		iamTests(expect);
	});

	describe("Source tests", () => {
		sourceTests(expect);
	});

	describe("Build tests", () => {
		buildTests(expect);
	});

	describe("KMS tests", () => {
		kmsTests(expect);
	});

	describe("VM tests", () => {
		vmTests(expect);
	});
});
