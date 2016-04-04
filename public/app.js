$(document).ready(function() {
    FastClick.attach(document.body);
    init_uploader();
});

var initial_bench = 0;
var done_bench = 0;

var init_uploader = function() {
    $(function() {
        $('#clicktest').on('touchstart',function() {
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
                $('#submit').slideUp();
                $('#fileselect').slideUp();
                $('.progress').slideDown();
            },
            uploadProgress: function(event, position, total, percentComplete) {
                var percentVal = percentComplete + '%';
                percent.width(percentVal);
                percent.html(percentVal);
                $('.radial-progress').attr('data-progress', percentComplete)
            },
            complete: function(xhr) {
                status.html(xhr.responseText);
                initial_bench--;
                done_bench++;

                console.log("inital", initial_bench, "done", done_bench);
            }
        });
    });
}
