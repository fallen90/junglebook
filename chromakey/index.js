var fs = require('fs'),
    PNG = require('pngjs').PNG,
    easyimg = require('easyimage'),
    path = require('path'),
    im = require('imagemagick-composite'),
    crypto = require('crypto'),
    env = process.env;

var fg = __dirname + "/fg.png";
var bg = __dirname + "/bg.png";
var mask = __dirname + "/warm.png";
var tmp = env.OPENSHIFT_DATA_DIR + ".tmp/";
var outputs = env.OPENSHIFT_DATA_DIR + 'outputs/';

if (!fs.existsSync(tmp)){
    fs.mkdirSync(tmp);
}

exports.create = function(inf, key, success, failed) {
    console.log('CHROMA', 'Preparing convertion...');
    var outf = tmp + key + '.butas.png';
    easyimg.convert({
        src: inf,
        dst: tmp + key + '.jpg.png'
    }).then(function(file) {
        console.log('CHROMA', 'Processing file...');
        processFile(file.path, outf, key, success, failed);
    }, function(err) {
        console.error('error converting image', err, inf, outf);
        failed(err, inf, outf);
    });
};

var processFile = function(inf, outf, key, success, failed) {
    var dst = fs.createWriteStream(outf);
    fs.createReadStream(inf)
        .pipe(new PNG({
            filterType: 4
        }))
        .on('parsed', function() {
            console.log('CHROMA', 'Applying chromakey effect on image');

            var pixelSize = 4;
            var row = [];
            var alphaMap = initialAlphaMap();
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var idx = (this.width * y + x) << 2;
                    var pixel = {
                        r: this.data[idx],
                        g: this.data[idx + 1],
                        b: this.data[idx + 2],
                        a: this.data[idx + 3]
                    };
                    var newPixel = operate(pixel, alphaMap);
                    this.data[idx] = newPixel.r;
                    this.data[idx + 1] = newPixel.g;
                    this.data[idx + 2] = newPixel.b;
                    this.data[idx + 3] = newPixel.a;
                }
            }
            console.log('CHROMA', 'Packing file...');

            //save file
            this.pack()
                .pipe(dst);
            //process after saving
            dst.on('close', function() {
                console.log('CHROMA', 'Compositing image...');

                var inter = tmp + key + '.inter.png';
                var masked = tmp + key + '.masked.png';
                var output = outputs + key + '.out.png';

                im.composite(['-geometry', '300x250+350+510', outf, bg, inter],
                    function(err, metadata) {
                        console.log('CHROMA', 'First step done', 'output and background merged');
                        if (err) throw err
                        im.composite([mask, inter, masked],
                            function(err, metadata) {
                                console.log('CHROMA', 'Second step done', 'masking image and output from 1st merged');
                                if (err) throw err
                                im.composite([fg, masked, output],
                                    function(err, metadata) {
                                        console.log('CHROMA', 'Final step done', 'foreground applied on top.');
                                        if (err) throw err
                                        cleanup(key); //cleanup
                                        success(output); //return
                                    });
                            });
                    });
            });

        }, function(err) {
            console.log('failed to parsed stream', err, "outf", outf, "inf", inf);
            failed(err);
        });
};

var initialAlphaMap = function() {
    var alphaMapArray = [];
    var fullyTransparentEndIndex = 35;
    var semiTransparentEndIndex = 90;
    for (var i = 0; i < 510; i++) {
        if (i < fullyTransparentEndIndex) {
            alphaMapArray.push(255);
        } else if (i >= fullyTransparentEndIndex && i < semiTransparentEndIndex) {
            var lengthOfSemis = semiTransparentEndIndex - fullyTransparentEndIndex;
            var indexValue = i - fullyTransparentEndIndex;
            var multiplier = 1 - (indexValue / lengthOfSemis);
            var alphaValue = multiplier * 255.0;
            alphaMapArray.push(alphaValue);
        } else {
            alphaMapArray.push(0);
        }
    }
    return alphaMapArray;
};

var operate = function(pixel, alphaMap) {
    var redValue = pixel.r;
    var greenValue = pixel.g;
    var blueValue = pixel.b;
    if (greenValue > redValue && greenValue > blueValue)
        pixel.a = alphaMap[(greenValue * 2) - redValue - blueValue];
    else
        pixel.a = 255;

    return pixel;
};

var cleanup = function(key){
    console.log('CHROMA', 'Starting cleanup...');
    fs.unlinkSync(tmp + key + '.butas.png');
    fs.unlinkSync(tmp + key + '.inter.png');
    fs.unlinkSync(tmp + key + '.masked.png');
    fs.unlinkSync(tmp + key + '.jpg.png');
    console.log('CHROMA', 'Cleanup success');
};
