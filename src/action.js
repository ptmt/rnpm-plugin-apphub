const path = require('path');
const log = require('npmlog');
const https = require('https');
const fs = require('fs');
const url = require('url');
const getProjectMetadata = require('./projectMetadata');
const glob = require('glob');
const childProcess = require('child_process');

const APPHUB_API = 'https://api.apphub.io/v1/upload';

log.heading = 'rnpm-apphub';

/**
 * Updates project and linkes all dependencies to it
 *
 * If optional argument [packageName] is provided, it's the only one that's checked
 */
module.exports = function link(config, args) {
  const project = config.getProjectConfig();

  if (!project) {
    log.error('ERRPACKAGEJSON', `No package found. Are you sure it's a React Native project?`);
    return;
  }

  if (!project.ios) {
    log.error('ERRPACKAGEJSON', `No ios project found. Currently AppHub is only for iOS`);
    return;
  }

  /*
   * Find .ipa to upload
   */

  // TODO: would be nice to reuse that from core
  const GLOB_EXCLUDE_PATTERN = ['node_modules/**', 'Examples/**', 'examples/**', 'Pods/**'];

  const ipas = glob.sync('**/*.ipa', {
    pwd: project.ios.sourceDir,
    ignore: GLOB_EXCLUDE_PATTERN,
  });

  if (ipas.length === 0) {
    log.error('ERRIPA', `No .ipa files found. Please, export the application`);
    return;
  }

  /*
   * Filling the metadata from plist and last git commit
   */
  const lastGitMessage = childProcess.execSync('git log -1 --pretty=%B | cat').toString().split('\n')[0];
  const metadata = getProjectMetadata(project);


  /*
   * Put file onto the server
   */
  if (args.length < 2) {
    log.error('ERRTOKENS', 'No AppID and AppTokens provided. Please obtain them from AppHub dashbaord');
    return;
  }

  log.info('Uploading build', metadata.version);
  log.info('Uploading build', lastGitMessage);

  const result = childProcess.execSync(`
    curl -X PUT \
     -H "X-AppHub-Application-ID: ${args[0]}" \
     -H "X-AppHub-Application-Secret: ${args[1]}" \
     -H 'X-AppHub-Build-Metadata: {
           "target": "all",
           "name": "${metadata.version}",
           "description": "${lastGitMessage} // uploaded by rnpm-plugin-apphub",
           "app_versions": ["${metadata.version}"]
      }' \
      -L https://api.apphub.io/v1/upload \
      --upload-file ./build/moneyed.ipa
  `);

  log.info(result);

};
