const { withXcodeProject } = require('expo/config-plugins');

/**
 * Expo's iOS template runs react-native-xcode.sh through an unquoted backtick substitution, so the
 * "Bundle React Native code and images" phase breaks when the project path contains spaces
 * (".../Productie Altmar Group/..."). Quote the resolved script path.
 */
module.exports = function withQuotedBundleScript(config) {
  return withXcodeProject(config, (cfg) => {
    const phases = cfg.modResults.hash.project.objects.PBXShellScriptBuildPhase || {};
    for (const phase of Object.values(phases)) {
      if (typeof phase !== 'object' || typeof phase.shellScript !== 'string') continue;
      phase.shellScript = phase.shellScript.replace(
        /`(\\"\$NODE_BINARY\\" --print [^`]*react-native-xcode\.sh'\\")`/,
        '\\"$($1)\\"'
      );
    }
    return cfg;
  });
};
