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

                // make the audio element
                const audio = document.createElement('audio');
                audio.setAttribute('controls', '');
                audio.controls = true;
                console.log(recordedChunks);
                const blob = new Blob(recordedChunks, {'type' : 'audio/ogg; codecs=opus'});
                console.log(blob);
                audio.src = window.URL.createObjectURL(blob);
                clipCard.append(audio);

                // make the delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = "x";
                deleteButton.onclick = function(evt) {
                    evt.target.parentNode.parentNode.removeChild(evt.target.parentNode);
                }
                clipCard.append(deleteButton);
                
                clipContainer.appendChild(clipCard);

                // send the audio clip to the server
                var this2 = this;
                var request = new XMLHttpRequest();
                request.open('POST', my_ajax_obj.ajax_url, true);
                request.onload = function() {
                    if (this.status >= 200 && this.status < 400) {
                        console.log("upload success",this);
                        console.log("this.response", this.response);
                    }
                    else {
                        console.log("Upload failed",this);
                        console.log("this.response", this.response);
                    }
                }
		request.send({
		   _ajax_nonce: my_ajax_obj.clip_nonce,
			action: "upload-snippet",
	  		title: "foo"
  		});
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

