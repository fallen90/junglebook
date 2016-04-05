$(document).ready(function() {
    FastClick.attach(document.body);
    $('#capture_btn').on('touchend click', function(e) {
        e.preventDefault();
        $('input[type=file]').trigger('click');
    });
    init_uploader();
});

var initial_bench = 0;
var done_bench = 0;

var init_uploader = function() {
    document.getElementById("fileselect").onchange = function() {
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#preview-image').attr('src', e.target.result).parent().show();
            setTimeout(function() {
                // var img = document.getElementById('preview-image');
                // var width = img.width;
                // var height = img.height;
                // var ratio = width/height;
                // if(ratio > 1){
                //     alert('portrait');
                // } else {
                //     alert('landscape');
                // }
            });
        }
        reader.readAsDataURL(this.files[0]);


        $('#submit').fadeIn();
    };
    $(function() {
        $('#clicktest').on('touchstart', function() {
            $('#status').append('<b>Clicked</b><br/>');
        });
        var bar = $('.bar');
        var percent = $('.percent');
        var status = $('#status');

        var initial = $('bench_init');
        var doneb = $('bench_done');

        $('form').ajaxForm({
            beforeSend: function() {
                status.empty();
                var percentVal = '0%';
                percent.width(percentVal);
                percent.html(percentVal);
                initial_bench++;
                console.log("inital", initial_bench, "done", done_bench);
                $('#step1').slideUp();
                $('#step2').slideDown();
            },
            uploadProgress: function(event, position, total, percentComplete) {
                var percentVal = percentComplete + '%';
                percent.width(percentVal);
                percent.html(percentVal);
                $('.radial-progress').attr('data-progress', percentComplete)
            },
            complete: function(xhr) {
                initial_bench--;
                done_bench++;
                console.log("inital", initial_bench, "done", done_bench);
                $('#step2').slideUp();
                $('#step3').slideDown();
                var responsetxt = xhr.responseText;
                response = JSON.parse(responsetxt);
                checkImage("/outputs/" + response.download + ".out.png", response.download);
            }
        });
    });
}

function checkImage(url, key) {
    var intx = setInterval(function() {
        if (imageExists(url)) {
            clearInterval(intx);
            $('#downloadImage').attr('href', url).show();
            $('#proci').fadeOut();
            $('#print_num').html(key).show();
            $('cite').show();
            setTimeout(function() {

                $('#imgdownload').attr('src', url).width('100%').show();

            }, 1200);
        }
    }, 1200);
}

function imageExists(image_url) {

    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;

}
