var express = require('express');
var app = express();
var fs = require('fs');
var busboy = require('connect-busboy');
var chromakey = require('./chromakey');
var path = require('path');
var low = require('lowdb')
var storage = require('lowdb/file-sync')
var db = low('db.json', { storage });
var gdrive = require('./gdrive');
var http = require('http');
var env = process.env;
// var upload_dir = __dirname + '/public/uploads/';
// var output_dir = __dirname + '/public/outputs/';
var upload_dir = env.OPENSHIFT_DATA_DIR + 'uploads/'
var output_dir = env.OPENSHIFT_DATA_DIR + 'outputs/'

if (!fs.existsSync(upload_dir)){
    fs.mkdirSync(upload_dir);
}
if (!fs.existsSync(output_dir)){
    fs.mkdirSync(output_dir);
}

app.set('port', (process.env.PORT || 5000));

app.set('view engine', 'jade');
app.set('views', 'public/views')
app.use(busboy());

// app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/public/lib'));
app.use('/outputs', express.static(output_dir));

app.get('/health', function(req, res) {
    res.writeHead(200);
    res.end();
});

app.get('/', function(req, res) {
    res.render('index', { title: 'Hey' });
});

app.get('/download', function(req, res) {
    res.render('download', { title: 'Hey' });
});

app.post('/file-upload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename) {

        var key = db('images').size() + 1;
        filename = upload_dir + key + path.extname(filename);

        fstream = fs.createWriteStream(filename);
        file.pipe(fstream);

        fstream.on('close', function() {
            // res.redirect('back'); //redirect back to main page
            // res.send('file uploaded !');
            chromakey.create(filename, key, function(file) {
                console.log('file processed', file);
                db('images').push({
                    id: key,
                    file: file
                });
                res.end();
                uploadFile(key);
            }, function(err) {
                console.log('failed');
            });
        });
    });
});

app.set('port', env.NODE_PORT || 3000);
app.set('ip', env.NODE_IP || 'localhost');


http.createServer(app).listen(app.get('port'), app.get('ip'), function() {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'), app.get('port'));
});

var uploadFile = function(key) {
    console.log('Uploading...');
    gdrive.uploadFile(key + '.out.png', key + '.out.png', '0B3zHm_k_51jLWlBUZzVmclJDemc', function(result) {
        console.log('success!!!', result);
    }, function(err) {
        console.log('Error!!!', err);
    });
}
