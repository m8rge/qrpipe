$(document).on('ready', function() {
    var canvasContext;
    var video;
    var pipeInterval;

    function isCanvasSupported() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    function initCanvas(w, h) {
        var canvas = document.getElementById("qr-canvas");
        canvas.width = w;
        canvas.height = h;
        canvasContext = canvas.getContext("2d");
        canvasContext.clearRect(0, 0, w, h);
    }

    function captureToCanvas() {
        try {
            canvasContext.drawImage(video, 0, 0);
            qrcode.decode();
        } catch (e) {
//            console.log(e);
        }
    }

    function openWebCam() {
        document.getElementById("video").innerHTML = '<video id="v" autoplay></video>';
        video = document.getElementById("v");

        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);

        navigator.getUserMedia({video: true, audio: false}, function(localMediaStream) {
                video.src = window.URL.createObjectURL(localMediaStream);
                video.onloadedmetadata = function() {
                    pipeInterval = setInterval(captureToCanvas, 1);
                };
            }, function(err) {
                console.log("The following error occurred: ", err);
            }
        );
    }

    var qrcodeCreator = new QRCode(document.getElementById("qrcode"), {
        width : 700,
        height : 700
    });

    $('#listen').on('click', function() {
        var status = 'closed';
        var data = '';
        var lastFrame;
        qrcode.callback = function (text) {
            $('#currentText').text(text);
            if (status == 'closed' && text == '#start-send') {
                status = 'sending';
            }
            if (status == 'sending') {
                if (text == '#end-send') {
                    status = 'closed';
                } else if (text.match(/^#frame-\d+/)) {
                    var matches = /^#frame-(\d+)\|(.+)/.exec(text);
                    if (lastFrame != matches[1]) {
                        lastFrame = matches[1];
                        data += matches[2];
                        $('#result').text(data);
                        qrcodeCreator.makeCode('#frame-ok-'+matches[1]);
                        $('#encodedText').text('#frame-ok-'+matches[1]);
                    }
                }
            }
        };
        qrcodeCreator.makeCode('#listen');
        $('#encodedText').text('#listen');
        $(this).attr('disabled', 'disabled');
    });

    function makeFrame(frameNumber, data) {
        return '#frame-'+frameNumber+'|'+data;
    }

    $('#send').on('click', function() {
        var status = 'closed';
        var frameNumber = 0;
        var frameData;
        var data = $('#send-text').val();
        qrcode.callback = function (text) {
            $('#currentText').text(text);
            if (status == 'closed' && text == '#listen') {
                status = 'sending';
                frameData = data.substring(frameNumber, frameNumber+1);
                qrcodeCreator.makeCode(makeFrame(frameNumber, frameData));
                $('#encodedText').text(makeFrame(frameNumber, frameData));
            }
            if (status == 'sending') {
                if (text == '#frame-ok-'+frameNumber) {
                    frameNumber++;
                    if (data.length >= frameNumber) {
                        frameData = data.substring(frameNumber, frameNumber + 1);
                        qrcodeCreator.makeCode(makeFrame(frameNumber, frameData));
                        $('#encodedText').text(makeFrame(frameNumber, frameData));
                    } else {
                        qrcodeCreator.makeCode('#end-send');
                        $('#encodedText').text('#end-send');
                    }
                }
            }
        };
        qrcodeCreator.makeCode('#start-send');
        $('#encodedText').text('#start-send');
        $(this).attr('disabled', 'disabled');
    });

    initCanvas(640, 480);
    openWebCam();

    $('#close').on('click', function() {

    });
});