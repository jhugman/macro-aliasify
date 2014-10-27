'use strict';
var _ = require('lodash'),
    path = require('path'),
    fileSelector = require('overidify/lib/file-selection'),
    resolve = require('resolve');


module.exports = function (dirname) {
  dirname = dirname || '.';
  var ctx = gatherRecursive(
    dirname,
    '.', 
    {
      extensions: {},
    }
  );

  var ret = [];
  _.each(ctx.extensions, function (i, moduleName) {
    ret.push(
      ctx.extensions[moduleName] 
        + ':'
        + moduleName
    );
  });
  return ret;
};

///////////////////////////////////////////////////////////////////////

function gatherRecursive (srcDir, currentModule, context, seen) {
  
  seen = seen || {};
  if (seen[currentModule]) {
    return;
  }

  // this is to stop massive tree crawls.
  if (!gatherForModule(srcDir, currentModule, context)) {
    return;
  }

  seen[currentModule] = true;

  var dependencies = loadObjectFromPkgJson(srcDir, 'dependencies'),
      optionalDeps = loadObjectFromPkgJson(srcDir, 'optionalDependencies');

  _.chain(dependencies)
    .keys()
    .union(_.keys(optionalDeps))
    .each(function (modulePath) {
      var childSrc = findPackageDir(srcDir, modulePath);
      gatherRecursive(childSrc, modulePath, context, seen);
    })
    .value();

  return context;
}

function gatherForModule (srcDir, moduleName, context) {
  var aliasModule = loadObjectFromPkgJson(srcDir, 'aliasify');

  if (!aliasModule) {
    return;
  }

  var extensions = aliasModule.aliases;

  _.each(extensions, function (i, key) {
    var absPath = path.join(moduleName, extensions[key]);
    if (moduleName[0] === '.') {
      absPath = './' + absPath;
    }
    if (aliasModule.verbose) {
      console.log('>> Aliasing: ' + key + ' as ' + absPath);
    }
    context.extensions[key] = absPath;
  });

  return context;
}

function writeNodeModuleAliases (dirname, context) {
  var fs = require('fs'),
      templateText = fs.readFileSync(path.join(__dirname, 'alias.template.js')),
      template = _.template(templateText);
  _.each(context.extensions, function (i, moduleName) {
    fs.writeFileSync(
      path.join(dirname, moduleName + '.js'), 
      template({
        moduleName: moduleName,
        filepath: context.extensions[moduleName],
      }));
  });
}

///////////////////////////////////////////////////////////////////////
function loadObjectFromPropertyValue (srcDir, property) {
  if (_.isString(property)) {
    return loadObjectFromModule(srcDir +'/' + property);
  } else if (_.isObject(property) && !_.isArray(property)) {
    return property;
  }
}

function loadObjectFromPkgJson (srcDir, propertyName) {
  var pkgJson = loadObjectFromModule(srcDir + '/' + 'package.json');
  var property = pkgJson[propertyName];
  return loadObjectFromPropertyValue(srcDir, property);
}

function loadObjectFromModule (srcFile) {
  return require(srcFile);
}

function findPackageDir(srcDir, moduleName) {
  var res = resolve.sync(moduleName + '/package.json', { basedir: srcDir });
  return path.dirname(res);

}
///////////////////////////////////////////////////////////////////////
