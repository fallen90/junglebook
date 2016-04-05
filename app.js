var express = require('express'),
    app = express(),
    fs = require('fs'),
    busboy = require('connect-busboy'),
    chromakey = require('./chromakey'),
    path = require('path'),
    low = require('lowdb'),
    storage = require('lowdb/file-sync'),
    db = low('db.json', { storage }),
    gdrive = require('./gdrive'),
    http = require('http'),
    env = process.env,
    config = require('./chromakey/config'),
    upload_dir = config.currentConfig.uploads,
    output_dir = config.currentConfig.outputs,
    tmp_dir = config.currentConfig.tmp;

if (!fs.existsSync(upload_dir)) {
    fs.mkdirSync(upload_dir);
}
if (!fs.existsSync(output_dir)) {
    fs.mkdirSync(output_dir);
}
if (!fs.existsSync(tmp_dir)) {
    fs.mkdirSync(tmp_dir);
}

app.set('port', env.NODE_PORT || 80);
app.set('ip', env.NODE_IP || '0.0.0.0');
app.set('view engine', 'jade');
app.set('views', 'public/views');

app.use('/lib', express.static(__dirname + '/public/lib'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use('/outputs', express.static(output_dir));
app.use(busboy());

app.use(express.static(__dirname + '/public'));

//routes

app.get('/', function(req, res) {
    res.render('index', { title: 'Jungle Book' });
});

app.get('/health', function(req, res) {
    res.writeHead(200);
    res.end();
});

app.get('/download', function(req, res) {
    console.log(req.params);
    var id = req.param('id'); //deprecated
    if (typeof id != 'undefined') {
        if (!fs.existsSync(output_dir + id + ".out.png")) {
            res.render('download', { title: 'Download Output', id: id, exists: false });
        } else {
            res.render('download', { title: 'Download Output', id: id, exists: true });
        }
    }
});

app.post('/file-upload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename) {
        var tmpk = ((db('images').size() + 1) * (new Date().getTime())).toString();
        var key = tmpk.substring(tmpk.length, tmpk.length/2);
        filename = upload_dir + key + path.extname(filename);

        saveToDb(key, filename);

        console.log('EXPRESS', `Received file ${filename}...`);
        fstream = fs.createWriteStream(filename);
        file.pipe(fstream);

        fstream.on('close', function() {
            res.send({
                download: key,
                tmpk : tmpk
            });
            chromakey.create(filename, key, function(file) {
                console.log('file processed', file);
            }, function(err) {
                console.log('failed');
            });
        });
    });
});

var server = http.createServer(app).listen(app.get('port'), app.get('ip'), function() {
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

var saveToDb = function(key, file) {
    db('images').push({
        id: key,
        file: file
    });
}
