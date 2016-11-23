const path = require('path');
const log = require('npmlog');
const https = require('https');
const fs = require('fs');
const url = require('url');
const projectMetadata = require('./projectMetadata');
const glob = require('glob');
const childProcess = require('child_process');
const uuid = require('uuid');
const mkdirp = require('mkdirp');

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
   * Build application .zip
   */

   const plistFile = projectMetadata.getPlistPath(project)
   if (!plistFile) {
     log.error('ERRPLIST', '.plist is not found');
     return;
   }
   const outputZip = path.join(process.cwd().replace(/ /g, '\\ '), './build/app.zip');
   const tmpDir = path.join('/tmp', 'apphub', uuid.v4());
   const buildDir = path.join(tmpDir, 'ios');
   mkdirp.sync(buildDir);

   var options = [
     '--entry-file', 'index.ios.js',
     '--dev', false,
     '--bundle-output', path.join(buildDir, 'main.jsbundle'),
     '--assets-dest', buildDir,
     '--platform', 'ios',
   ];

   var cmds = [
     'node node_modules/react-native/local-cli/cli.js bundle ' + options.join(' '),
     'cp ' + plistFile + ' ' + buildDir,
     'cd ' + tmpDir + ' && zip -r ' + outputZip + ' ios',
   ];
   for (var i = 0; i < cmds.length; i++) {
     var cmd = cmds[i];
     childProcess.execSync(cmd, { stdio: [0, 1, 2] }, { cwd: process.cwd()});
   }

  /*
   * Filling the metadata from plist and last git commit
   */
  const lastGitMessage = childProcess.execSync('git log -1 --pretty=%B | cat').toString().split('\n')[0];
  const metadata =  projectMetadata.getProjectMetadata(project);
  if (!metadata) {
    log.error('ERRPLIST', '.plist is not found');
    return;
  }
  /*
   * Put file onto the server
   */
  if (args.length < 2) {
    log.error('ERRTOKENS', 'No AppID and AppTokens provided. Please obtain them from AppHub dashbaord');
    return;
  }

  log.info('Uploading build...', metadata.version, lastGitMessage);

  const result = childProcess.execSync(`
    curl -X PUT \
     -H "X-AppHub-Application-ID: ${args[0]}" \
     -H "X-AppHub-Application-Secret: ${args[1]}" \
     -H "Content-Type: application/zip" \
     -H 'X-AppHub-Build-Metadata: {
           "target": "all",
           "name": "${metadata.version}",
           "description": "${lastGitMessage} // by rnpm-plugin-apphub",
           "app_versions": ["${metadata.shortVersion}"]
      }' \
      -L https://api.apphub.io/v1/upload \
      --upload-file ./build/app.zip
  `);

  log.info(result);

};
