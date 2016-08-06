var proc = require('child_process');
var fs = require('fs');
var path = require('path');

var isJenkins = false;
if(process.argv.length > 2)isJenkins = process.argv[2] === 'jenkins';

var lintReportString = '';
if(isJenkins) {
  lintReportString = '--reporter checkstyle ';
}

function exec(cmd) {
  return new Promise(function(resolve, reject) {
    proc.exec(cmd, function(error, stdout, stderr) {
      if(error) {
        console.log(error.name + ' ' + error.message);
        resolve({ret: false, out: stdout, err: stderr });
      }
      resolve({ret: true, out: stdout, err: stderr });
    });
  });
}

function jscs(dir, name) {
  if(!name)name = dir;
  console.log('Checking coding style in directory: ' + dir);
  return exec(path.join('node_modules', '.bin', 'jscs')+ ' ' + lintReportString + dir)
    .then((out) => {
      console.log('Checking coding style in directory ' + dir + ' complete!');
      if(isJenkins) {
        fs.writeFileSync('checkstyle-' + name + '.xml', out.out);
      }else {
        if(out.out) console.log(out.out);
      }
      return out.ret;
    });
}

function jshint(dir, name) {
  if(!name)name = dir;
  console.log('Checking coding errors in directory: ' + dir);
  return exec(path.join('node_modules', '.bin', 'jshint') + ' --esversion 6 ' + lintReportString + dir)
    .then((out) => {
      console.log('Checking coding errors in directory ' + dir + ' complete!');
      if(isJenkins) {
        fs.writeFileSync('checkstyle-' + name + '.xml', out.out);
      }else {
        if(out.out) console.log(out.out);
      }
      return out.ret;
    });
}

function lint(dir, name) {
  var local_name = name;
  if(!local_name)local_name = dir;
  return Promise.all([ jscs(dir, local_name + "-jscs"), jshint(dir, local_name + "-jshint" )]).then(x => x.every(v => v));
}

function babel(dir, outDir) {
  console.log('Transforming code in: ' + dir);
  return exec(path.join('node_modules', '.bin', 'babel') + ' ' + dir + ' --presets es2015 --out-dir ' + outDir)
    .then((out) => {
      console.log('Transforming code in ' + dir + " complete!");
      if(out.out)console.log(out.out);
      return out.ret;
    });
}

function browserify(rootFile, outFile) {
  console.log('Transforming client code in: ' + rootFile);
  return exec(path.join('node_modules', '.bin', 'browserify') + ' -t [ babelify --presets [ es2015 ] ] ' + rootFile + ' --outfile ' + outFile)
    .then((out) => {
      console.log('Transforming client code in ' + rootFile + " complete!");
      if(out.out)console.log(out.out);
      return out.ret;
    });
}

Promise.all([ browserify('src/slideshow.js', 'public/slideshow.js') ])
  .then(vals => vals.every(v => v))
  .then(result => {
    if(!result) {
      console.log("Failed to build, build errors detected.")
      process.exit(1);
    }
  })
  .then(() => {
    console.log('Build completed successfully!')
  })
  .catch(err => console.dir(err));
