# CDFlow
Create all you need in GCloud with only a JSON file.

## Project setup
1. First of all you need to have a billing account in GCloud (in future i will implement AWS/ Azure and others).
2. After that, Creates a new project, then a service account with owner privileges, and download a JSON key file for authentication.
3. Enable the Cloud Resource Manager API, then run the npm install command.

```
npm install cdflow --save
```

You can deactivate the API's after cdflow create the project definitions, when cdflow run again they will be reactivate (in future, i will deactivate after run the creation)

### Running
```
npm run serve
```

### Needed GCloud API's
- [x] IAM API - iam.googleapis.com
- [x] Source API - sourcerepo.googleapis.com
- [x] Cloud Build API - cloudbuild.googleapis.com
- [x] Cloud KMS API - cloudkms.googleapis.com
- [x] Compute Engine API - compute.googleapis.com

## Author
Karl Alexander - [GitHub Page](https://github.com/karlsmarx).