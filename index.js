var fs = require('fs'),
    exec = require('child_process').spawn;
var through2 = require('through2'),
    tmp = require('temporary');

function saxonStream2(jarPath,xslPath,param,opt){
  var buf = [];
  var timeout = 5000;
  var saxonOpts = ['-warnings:silent'];

  if(opt!==undefined){
    if(opt.timeout!==undefined) timeout = opt.timeout;
    if(opt.saxonOpts!==undefined) saxonOpts = opt.saxonOpts;
  }

  return through2(function(c,e,n){
    buf.push(c+'');
    n();
  },function(n){
    var self = this;
    var data = buf.join('');
    var xml = new tmp.File();
    var result = new tmp.File();
    xml.writeFileSync(data);

    var opts = [
      '-jar',jarPath,
      '-s:'+xml.path,
      '-xsl:'+xslPath,
      '-o:'+result.path,
      'param='+param
    ];

    // Array.prototype.push.apply(opts,saxonOpts);
    opts = opts.concat(saxonOpts);

    var cmd = exec('java',opts,{timeout:timeout});
    
    cmd.stdout.on('data', function(data) {
      console.log(data);
    });

    cmd.stderr.on('data', function(data) {
      console.log('cmd stderr:'+data);
    });

    cmd.on('error',function(error){
      console.log('error');
      console.log(error);
    });

    cmd.on('exit',function(code,sig){
      var cont = fs.readFileSync(result.path);
      self.push(cont);
      result.unlink();
      n();
    });
  });
};

module.exports = saxonStream2;
