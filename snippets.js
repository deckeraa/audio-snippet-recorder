function testScript(evt) {
    const parent = evt.target.parentElement;
    const clipContainer = parent.querySelector(".clip-container");
    const stopButton = parent.querySelector(".stop");

    let recordedChunks = [];

    if(navigator.mediaDevices.getUserMedia) {
        let onSuccess = function(stream) {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("Started recording");

            stopButton.onclick = function() {
                mediaRecorder.stop();
                console.log(mediaRecorder.state);
                console.log("recorder stopped");
            }

            mediaRecorder.ondataavailable = function(e) {
                recordedChunks.push(e.data);
            }

            mediaRecorder.onstop = function(e) {
                console.log("mediaRecorder.onStop");
                const clipCard = document.createElement('div');
                const audio = document.createElement('audio');
                audio.setAttribute('controls', '');
                audio.controls = true;
                console.log(recordedChunks);
                const blob = new Blob(recordedChunks, {'type' : 'audio/ogg; codecs=opus'});
                console.log(blob);
                audio.src = window.URL.createObjectURL(blob);
                clipCard.append(audio);
                
                clipContainer.appendChild(clipCard);
            }
        }
        let onError = function(err) {
            console.log("Encountered the following the error while recording", err);
        }
        navigator.mediaDevices.getUserMedia({audio: true}).then(onSuccess, onError);
    } else {
        console.log("getUserMedia is not supported by your browser and snippets cannot be recorded");
    }
}

