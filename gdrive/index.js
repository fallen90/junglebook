var fs = require('fs'),
    readline = require('readline'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    drive = google.drive('v3'),
    path = require('path'),
    low = require('lowdb'),
    storage = require('lowdb/file-sync'),
    db = low('db.json', { storage }),
    config = require('../chromakey/config'),
    SCOPES = ['https://www.googleapis.com/auth/drive'],
    TOKEN_DIR = __dirname + '/',
    TOKEN_PATH = TOKEN_DIR + 'drive-token.json',
    CLIENTSECRET_PATH = __dirname + "/client_secret.json",
    srcFolder = config.currentConfig.outputs;

exports.uploadFile = function(filename, destFile, folderId, success, failed) {

    var src = srcFolder + filename;
    var dest = destFile;

    fs.readFile(CLIENTSECRET_PATH, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            failed(err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Drive API.
        authorizeUpload(JSON.parse(content), src, dest, success, failed, folderId);
    });

};
exports.createFolder = function(foldername, success, failed) {
    fs.readFile(CLIENTSECRET_PATH, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            failed(err);
            return;
        }
        if (typeof db('folders').find({ 'name': foldername }) != 'undefined') {
            var folder = db('folders').find({ 'name': foldername });
            success(folder.id, folder);
        } else {
            authorize(JSON.parse(content), function(auth) {
                var fileMetadata = {
                    'name': foldername,
                    'mimeType': 'application/vnd.google-apps.folder'
                };
                drive.files.create({
                    auth: auth,
                    resource: fileMetadata,
                    fields: 'id'
                }, function(err, file) {
                    if (err) {
                        // Handle error
                        console.log(err);
                        failed(err);
                    } else {
                        console.log('Folder Id: ', file.id);
                        db('folders').push({
                            id: file.id,
                            name: foldername
                        });
                        success(file.id, file);
                    }
                });
            });
        }
    });
};


exports.listFiles = function() {



    fs.readFile(CLIENTSECRET_PATH, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            failed(err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Drive API.
        authorize(JSON.parse(content), listFiles);
    });

};

function authorizeUpload(credentials, src, dest, success, failed, folderId) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewTokenUpload(oauth2Client, src, dest, success, failed, folderId);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            uploadFile(oauth2Client, src, dest, success, failed, folderId);
        }
    });
}

function getNewTokenUpload(oauth2Client, src, dest, success, failed, folderId) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                failed(err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            uploadFile(oauth2Client, src, dest, success, failed, folderId);
        });
    });
}

function uploadFile(auth, src, dest, success, failed, folderId) {
    //{ version: 'v2', auth: oauth2Client }
    console.log('UPLOAD SRC', src);
    drive.files.create({
        auth: auth,
        uploadType: 'multipart',
        resource: {
            name: path.basename(dest),
            mimeType: 'image/png',
            parents: [folderId]
        },
        media: {
            mimeType: 'image/png',
            body: fs.createReadStream(src) // read streams are awesome!
        }
    }, function(err, file) {
        if (err) {
            failed(err);
        } else {
            console.log('success!!!', file);
            success({ message: 'success', res: file });
        }
    });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    var service = google.drive('v3');




    service.files.list({
        auth: auth,
        pageSize: 10,
        fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var files = response.files;
        if (files.length == 0) {
            console.log('No files found.');
        } else {
            console.log('Files:');
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                console.log('%s (%s)', file.name, file.id);
            }
        }
    });
}
