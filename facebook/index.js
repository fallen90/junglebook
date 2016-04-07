var https = require('https'),
    fs = require('fs'),
    FormData = require('form-data'),
    hashtag = " \n\n#JungleBook2016";

var ACCESS_TOKEN = "CAAWPW3KRpGEBAKLcQrQiiv28Hp7SEZCNqExdjRbaF8uHEKmD76GBxljB4FEZBZBA84atHZBEfzOZAP5WN0nKChK1jpuO4IT6yZAx1ij1dRLf9XZBmDuZB8dIZAZAY40nnVMBAuc4egCOp15VodQnBof1xo8o8ZCaMnyZCkxoZCaqT9QYxZAHRmZAWt8wXEN4fIXOHWxO6sOgYaaDJLyZCwqNjzvKIlfvKYECIHvPWWcZD";

var setAccessToken = function(token) {
    if (typeof token == undefined) return false;
    if (token.length < 10) return false;
    var ACCESS_TOKEN = token;
}

var createPost = function(msg, img, success, fail) {
    var start = (new Date()).getTime();
    if (typeof msg == undefined) return false;
    if (!fs.existsSync(img)) {
        console.error('[FB] img not existing');
        return false;
    }

    var form = new FormData(); 
    form.append('file', fs.createReadStream(img));
    form.append('message', msg + hashtag);

    //POST request options, notice 'path' has access_token parameter
    var options = {
        method: 'post',
        host: 'graph.facebook.com',
        path: '/me/photos?access_token=' + ACCESS_TOKEN,
        headers: form.getHeaders(),
    }

    //Do POST request, callback for response
    var request = https.request(options, function(res) {
        var end = (new Date()).getTime();
        console.log("done in " + ((end - start) / 1000) + "s" );
    	success(res);
    });

    //Binds form to request
    form.pipe(request);

    //If anything goes wrong (request-wise not FB)
    request.on('error', function(error) {
       fail(error);
    });
}


module.exports = {
    setAccessToken : setAccessToken,
    createPost : createPost
}