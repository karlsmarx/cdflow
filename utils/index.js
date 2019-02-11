const Build = require("./gcloud_build.js");
const Compute = require("./gcloud_compute.js");
const Iam = require("./gcloud_iam.js");
const Kms = require("./gcloud_kms.js");
const ServiceUsage = require("./gcloud_serviceUsage.js");
const Source = require("./gcloud_source.js");
const KeyGen = require("./keyGen.js");

module.exports = {
	Build,
	Compute,
	Iam,
	Kms,
	ServiceUsage,
	Source,
	KeyGen,
};
