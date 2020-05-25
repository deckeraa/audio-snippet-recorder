function testScript(evt) {
    const parent = evt.target.parentElement;
    const clipContainer = parent.querySelector(".clip-container");
    const stopButton = parent.querySelector(".stop");

    if(navigator.mediaDevices.getUserMedia) {
        let onSuccess = function(stream) {
            const mediaRecorder = new MediaRecorder(stream); // todo pick MIME-type
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("Started recording");

            stopButton.onclick = function() {
                mediaRecorder.stop();
                console.log(mediaRecorder.state);
                console.log("recorder stopped");
            }

            mediaRecorder.onstop = function(e) {
                console.log("mediaRecorder.onStop");
                const clipCard = document.createElement('h1');
                clipCard.textContent = "Here's a clip";
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

