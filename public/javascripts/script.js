navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

if (navigator.getUserMedia) {
        navigator.getUserMedia({
        video: false,
        audio: true}, onSuccess, onError);
    } else {
        alert('getUserMedia is not supported in this browser.');
    }

    window.audioContext ||
            (window.audioContext = window.webkitAudioContext);

    function onSuccess(stream) {
        alert('Successful!');

        var videoSource,
                audioContext,
                mediaStreamSource;
     
            // if (getVideo) {
            //     if (window.webkitURL) {
            //         videoSource = window.webkitURL.createObjectURL(stream);
            //     } else {
            //         videoSource = stream;
            //     }
     
            //     video.autoplay = true;
            //     video.src = videoSource;
            // }
     
            // if (getAudio && window.audioContext) {
            if (true && window.audioContext) {
                audioContext = new window.audioContext();
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                mediaStreamSource.connect(audioContext.destination);
            }
    }
     
    function onError() {
        alert('There has been a problem retreiving the audio streams - are you running on file:/// or did you disallow access?');
    }