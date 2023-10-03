"use strict";

const Cesium = require("cesium");
const child_process = require("child_process");
const dependencyTree = require("dependency-tree");
const fsExtra = require("fs-extra");
const gulp = require("gulp");
const Jasmine = require("jasmine");
const JasmineSpecReporter = require("jasmine-spec-reporter").SpecReporter;
const path = require("path");
const Promise = require("bluebird");
const yargs = require("yargs");

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const argv = yargs.argv;

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
const environmentSeparator = process.platform === "win32" ? ";" : ":";
const nodeBinaries = path.join(__dirname, "node_modules", ".bin");
process.env.PATH += environmentSeparator + nodeBinaries;

const specFiles = [
  "**/*.js",
  "!node_modules/**",
  "!coverage/**",
  "!doc/**",
  "!bin/**",
  "!dist/**",
];

module.exports = {
  "build-cesium": buildCesium,
  test: test,
  "test-watch": testWatch,
  coverage: coverage,
  cloc: cloc,
  "generate-third-party": generateThirdParty,
};

async function test() {
  const jasmine = new Jasmine();
  jasmine.loadConfigFile("specs/jasmine.json");
  jasmine.exitOnCompletion = false;
  jasmine.addReporter(
    new JasmineSpecReporter({
      displaySuccessfulSpec:
        !defined(argv.suppressPassed) || !argv.suppressPassed,
    }),
  );

  jasmine.exitOnCompletion = false;
  const results = await jasmine.execute();
  if (argv.failTaskOnError && results.overallStatus === "failed") {
    process.exitCode = 1;
  }
}

function testWatch() {
  return gulp.watch(specFiles).on("change", function () {
    // We can't simply depend on the test task because Jasmine
    // does not like being run multiple times in the same process.
    try {
      child_process.execSync("jasmine JASMINE_CONFIG_PATH=specs/jasmine.json", {
        stdio: [process.stdin, process.stdout, process.stderr],
      });
    } catch (exception) {
      console.log("Tests failed to execute.");
    }
  });
}

function coverage() {
  fsExtra.removeSync("coverage/server");
  child_process.execSync(
    "nyc" +
      " --all" +
      " --reporter=lcov" +
      " --dir coverage" +
      ' -x "specs/**" -x "bin/**" -x "coverage/**" -x "doc/**" -x "dist/**" -x "index.js" -x "gulpfile.js"' +
      " node_modules/jasmine/bin/jasmine.js" +
      " JASMINE_CONFIG_PATH=specs/jasmine.json",
    {
      stdio: [process.stdin, process.stdout, process.stderr],
    },
  );

  return Promise.resolve();
}

function cloc() {
  let cmdLine;
  const clocPath = path.join("node_modules", "cloc", "lib", "cloc");

  // Run cloc on primary Source files only
  const source = new Promise(function (resolve, reject) {
    cmdLine = `perl ${clocPath} --quiet --progress-rate=0` + ` lib/ bin/`;

    child_process.exec(cmdLine, function (error, stdout, stderr) {
      if (error) {
        console.log(stderr);
        return reject(error);
      }
      console.log("Source:");
      console.log(stdout);
      resolve();
    });
  });

  // If running cloc on source succeeded, also run it on the tests.
  return source.then(function () {
    return new Promise(function (resolve, reject) {
      cmdLine = `perl ${clocPath} --quiet --progress-rate=0` + ` specs/lib/`;
      child_process.exec(cmdLine, function (error, stdout, stderr) {
        if (error) {
          console.log(stderr);
          return reject(error);
        }
        console.log("Specs:");
        console.log(stdout);
        resolve();
      });
    });
  });
}

function amdify(source, subDependencyMapping) {
  let fullMatch;
  let variableName;
  let requireVariable;
  let requirePath;

  source = source.replace(/\r\n/g, "\n");

  let outputSource = source;

  // find module exports
  let returnValue;
  const findModuleExportsRegex = /module.exports\s*=\s*(.*?);\n/;
  const findModuleExports = findModuleExportsRegex.exec(source);
  if (defined(findModuleExports && findModuleExports.length > 0)) {
    fullMatch = findModuleExports[0];
    returnValue = findModuleExports[1];
    // remove module.exports from output source
    outputSource = outputSource.replace(fullMatch, "");
  }

  // create require mapping for dependencies
  const findRequireRegex = /const\s+(.+?)\s*=\s*require\("(.+?)"\);\n/g;
  let findRequire = findRequireRegex.exec(source);
  const requireMapping = {};
  while (defined(findRequire) && findRequire.length > 0) {
    fullMatch = findRequire[0];
    variableName = findRequire[1];
    requirePath = findRequire[2];
    requireMapping[variableName] = requirePath;
    // remove requires from output source
    outputSource = outputSource.replace(fullMatch, "");
    findRequire = findRequireRegex.exec(source);
  }
  // find places where sub-dependencies are pulled from a require
  const subdependencyMapping = {};
  const removeRequireMapping = [];
  for (requireVariable in requireMapping) {
    if (Object.prototype.hasOwnProperty.call(requireMapping, requireVariable)) {
      requirePath = requireMapping[requireVariable];
      const findSubdependencyString = `const\\s+(.+?)\\s*?=\\s*?${requireVariable}\\.(.+?);\n`;
      const findSubdependencyRegex = new RegExp(findSubdependencyString, "g");
      let findSubdependency = findSubdependencyRegex.exec(source);
      while (defined(findSubdependency) && findSubdependency.length > 0) {
        const mapping = subDependencyMapping[requirePath];
        if (!defined(mapping)) {
          throw new Error(
            `Build Failed: Module sub-dependency found for ${requirePath} with no defined mapping behavior.`,
          );
        }
        removeRequireMapping.push(requireVariable);
        fullMatch = findSubdependency[0];
        variableName = findSubdependency[1];
        const subdependencyPath = findSubdependency[2];
        subdependencyMapping[variableName] = mapping.prefix + subdependencyPath;
        // remove sub-dependency declarations from output source
        outputSource = outputSource.replace(fullMatch, "");
        findSubdependency = findSubdependencyRegex.exec(source);
      }
    }
  }
  // Top-level modules can be removed if mapped
  while (removeRequireMapping.length > 0) {
    const removeVariableName = removeRequireMapping.pop();
    delete requireMapping[removeVariableName];
  }
  // join sub-dependencies with requireMapping
  for (const subdependencyVariable in subdependencyMapping) {
    if (
      Object.prototype.hasOwnProperty.call(
        subdependencyMapping,
        subdependencyVariable,
      )
    ) {
      requireMapping[subdependencyVariable] =
        subdependencyMapping[subdependencyVariable];
    }
  }
  // amdify source
  outputSource = outputSource.replace(/"use strict";/g, "");

  // wrap define header
  const lines = [];
  for (const variable in requireMapping) {
    if (Object.prototype.hasOwnProperty.call(requireMapping, variable)) {
      lines.push(`import ${variable} from "${requireMapping[variable]}.js";`);
    }
  }
  let defineHeader = "";
  if (lines.length > 0) {
    defineHeader = `${lines.join("\n")}\n`;
  }
  let defineFooter = "\n";
  if (defined(returnValue)) {
    defineFooter = `\nexport default ${returnValue};\n`;
  }
  outputSource = defineHeader + outputSource + defineFooter;
  // remove repeat newlines
  outputSource = outputSource.replace(/\n\s*\n/g, "\n\n");
  return outputSource;
}

function buildCesium() {
  const basePath = "lib";
  const outputDir = "dist/cesium";
  const files = [
    "addDefaults.js",
    "addPipelineExtras.js",
    "ForEach.js",
    "parseGlb.js",
    "removePipelineExtras.js",
    "updateVersion.js",
  ];

  const subDependencyMapping = {
    cesium: {
      prefix: "../../Core/",
    },
  };

  const filesToAmdify = {};
  return Promise.map(files, function (fileName) {
    const filePath = path.join(basePath, fileName);

    // Get list of dependant files
    filesToAmdify[filePath] = true;
    return dependencyTree
      .toList({
        filename: filePath,
        directory: basePath,
        filter: function (path) {
          return path.indexOf("node_modules") === -1;
        },
      })
      .forEach(function (dependency) {
        filesToAmdify[path.relative(__dirname, dependency)] = true;
      });
  }).then(function () {
    return Promise.map(Object.keys(filesToAmdify), function (filePath) {
      const fileName = path.relative(basePath, filePath);
      return fsExtra.readFile(filePath).then(function (buffer) {
        let source = buffer.toString();
        source = amdify(source, subDependencyMapping);
        const outputPath = path.join(outputDir, fileName);
        return fsExtra.outputFile(outputPath, source);
      });
    });
  });
}

function getLicenseDataFromPackage(packageName, override) {
  override = defaultValue(override, defaultValue.EMPTY_OBJECT);
  const packagePath = path.join("node_modules", packageName, "package.json");

  if (!fsExtra.existsSync(packagePath)) {
    throw new Error(`Unable to find ${packageName} license information`);
  }

  const contents = fsExtra.readFileSync(packagePath);
  const packageJson = JSON.parse(contents);

  let licenseField = override.license;

  if (!licenseField) {
    licenseField = [packageJson.license];
  }

  if (!licenseField && packageJson.licenses) {
    licenseField = packageJson.licenses;
  }

  if (!licenseField) {
    console.log(`No license found for ${packageName}`);
    licenseField = ["NONE"];
  }

  let version = packageJson.version;
  if (!packageJson.version) {
    console.log(`No version information found for ${packageName}`);
    version = "NONE";
  }

  return {
    name: packageName,
    license: licenseField,
    version: version,
    url: `https://www.npmjs.com/package/${packageName}`,
    notes: override.notes,
  };
}

function readThirdPartyExtraJson() {
  const path = "ThirdParty.extra.json";
  if (fsExtra.existsSync(path)) {
    const contents = fsExtra.readFileSync(path);
    return JSON.parse(contents);
  }
  return [];
}

async function generateThirdParty() {
  const packageJson = JSON.parse(fsExtra.readFileSync("package.json"));
  const thirdPartyExtraJson = readThirdPartyExtraJson();

  const thirdPartyJson = [];

  const dependencies = packageJson.dependencies;
  for (const packageName in dependencies) {
    if (dependencies.hasOwnProperty(packageName)) {
      const override = thirdPartyExtraJson.find(
        (entry) => entry.name === packageName,
      );
      thirdPartyJson.push(getLicenseDataFromPackage(packageName, override));
    }
  }

  thirdPartyJson.sort(function (a, b) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

  fsExtra.writeFileSync(
    "ThirdParty.json",
    JSON.stringify(thirdPartyJson, null, 2),
  );
}
