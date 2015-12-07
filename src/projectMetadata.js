const plistParser = require('plist');
const glob = require('glob');
const xcode = require('xcode');
const path = require('path');
const fs = require('fs');

module.exports = function getProjectMetadata(projectConfig) {
  const project = xcode.project(projectConfig.ios.pbxprojPath).parseSync();

  const plistPath = path.join(
    projectConfig.ios.sourceDir,
    project.getBuildProperty('INFOPLIST_FILE').replace(/"/g, '').replace('$(SRCROOT)', '')
  );

  if (!fs.existsSync(plistPath)) {
    return false;
  }

  const plist = plistParser.parse(
    fs.readFileSync(plistPath, 'utf-8')
  );

  return {
    version: plist.CFBundleVersion,
    shortVersion: plist.CFBundleShortVersionString,
    bundleName: plist.CFBundleName,
  };
};
