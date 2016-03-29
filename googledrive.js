var gdrive = require('./gdrive');



gdrive.createFolder('day1', function(folder_id, folder_meta) {
    console.log('success!!!', folder_id, folder_meta);
    gdrive.uploadFile('diff.png', 'diff.png', folder_id, function(result) {
        console.log('success!!!', result);
    }, function(err) {
        console.log('Error!!!', err);
    });
}, function(err) {
    console.log('Error!!!', err);
});