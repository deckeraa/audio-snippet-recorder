function deleteSnippet(evt,snippet_id) {
    const root = evt.target.parentElement.parentElement.parentElement;
    const snippet = root.querySelector(".snippet-text").textContent;
    
    var formData = new FormData();
    formData.append('action',"delete_snippet");
    formData.append("_ajax_nonce", my_ajax_obj.nonce);
    formData.append("post_id",my_ajax_obj.post_id);
    formData.append("snippet",snippet);
    formData.append("snippet_id",snippet_id);

    jQuery.ajax({
        url: my_ajax_obj.ajax_url,
        type: "POST",
        data : formData,
        processData: false,
        contentType: false,
        success: function(data) {
            if (data.Success == "true") {
                evt.target.parentElement.parentElement.removeChild(evt.target.parentElement);
            }
            else {
                console.log("Couldn't delete snippet: ",data);
            }
        }
    });
    
}

function recordSnippet(evt) {
    const parent = evt.target.parentElement.parentElement.parentElement;
    const clipContainer = parent.querySelector(".clip-container");
    const startButton = parent.querySelector(".start");
    const stopButton = parent.querySelector(".stop");

    let recordedChunks = [];

    if(navigator.mediaDevices.getUserMedia) {
        let onSuccess = function(stream) {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            console.log("Started recording");

            stopButton.onclick = function() {
                mediaRecorder.stop();
                console.log("recorder stopped");
            }

            startButton.setAttribute('style', 'display: none;');
            stopButton.setAttribute('style', 'display: block;');

            mediaRecorder.ondataavailable = function(e) {
                recordedChunks.push(e.data);
            }

            mediaRecorder.onstop = function(e) {
                const clipCard = document.createElement('div');
                clipCard.className="flex";

                startButton.setAttribute('style', 'display: block;');
                stopButton.setAttribute('style', 'display: none;');

                // make the audio element
                const audio = document.createElement('audio');
                audio.setAttribute('controls', '');
                audio.controls = true;
                const blob = new Blob(recordedChunks, {'type' : 'audio/ogg; codecs=opus'});
                audio.src = window.URL.createObjectURL(blob);
                clipCard.append(audio);
                
                clipContainer.appendChild(clipCard);

                // send the audio clip to the server
                const snippet = parent.querySelector(".snippet-text").textContent;
                const filename = snippet+".ogg";
                var formData = new FormData();
                formData.append('action',"upload_snippet");
                formData.append("_ajax_nonce", my_ajax_obj.nonce);
                //formData.append("title","foo"); // TODO remove
                formData.append("post_id",my_ajax_obj.post_id);
                formData.append("snippet",snippet);
                
                formData.append("snippet_blob",blob,filename);
                jQuery.ajax({
                    url: my_ajax_obj.ajax_url,
                    type: "POST",
                    data : formData,
                    processData: false,
                    contentType: false,
                    success: function(data) {
                        // make the delete button
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'x';
                        deleteButton.className = "white b bg-red f3 ba br3 ma1 dim";
                        deleteButton.onclick = function(event) { deleteSnippet(event,data.snippet_id)};
                        clipCard.append(deleteButton);
                    }
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
