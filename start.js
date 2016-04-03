const cluster = require('cluster'),
    stopSignals = [
        'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ],
    production = process.env.NODE_ENV == 'production',
    stopping = false;

cluster.on('disconnect', function(worker) {
    try {
        if (production) {
            if (!stopping) {
                cluster.fork();
            }
        } else {
            process.exit(1);
        }
    } catch (e) {
        console.log('Exception Handled', e);
    }
});

if (cluster.isMaster) {
    var workerCount = require('os').cpus().length;

    console.log('Master cluster setting up ' + workerCount + ' workers...');
    console.log(`Starting ${workerCount} workers...`);

    for (var i = 0; i < workerCount; i++) {
        cluster.fork();
    }

    if (production) {
        stopSignals.forEach(function(signal) {
            process.on(signal, function() {
                console.log(`Got ${signal}, stopping workers...`);
                stopping = true;
                cluster.disconnect(function() {
                    console.log('All workers stopped, exiting.');
                    process.exit(0);
                });
            });
        });
    }

    cluster.on('online', function(worker) {
        try {
            console.log('Worker ' + worker.process.pid + ' is online');
        } catch (e) {
            console.log('Exception Handled', e);
        }
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
    
} else {
    require('./app.js');
}
