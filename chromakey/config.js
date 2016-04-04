var env = process.env;

var config_set = {
    openshift: {
        uploads: env.OPENSHIFT_DATA_DIR + 'uploads/',
        outputs: env.OPENSHIFT_DATA_DIR + 'outputs/',
        tmp: env.OPENSHIFT_DATA_DIR + '.tmp/',
        fg: __dirname + '/fg.png',
        bg: __dirname + '/bg.png',
        mask: __dirname + '/warm.png'
    },
    localhost: {
        uploads: __dirname + '/../public/uploads/',
        outputs: __dirname + '/../public/outputs/',
        tmp: __dirname + '/../public/.tmp/',
        fg: __dirname + '/fg.png',
        bg: __dirname + '/bg.png',
        mask: __dirname + '/warm.png'
    }
}

module.exports = {
    openshift: config_set.openshift,
    localhost: config_set.localhost,
    currentConfig: config_set.localhost
};
