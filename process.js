// var chroma = require('./chromakey'),
//     filename = process.argv[1],
//     tmpk = (new Date().getTime()).toString(),
//     key = tmpk.substring(tmpk.length, tmpk.length / 2);

// chroma.create(filename, key, function(file) {
//     console.log('file processed', file);
// }, function(err) {
//     console.log('failed');
// });

var fb = require('./facebook');
fb.createPost('show',__dirname + '/facebook/cat.jpg', function(res){
	console.log('success');
}, function(err){
	console.log('error');
});
