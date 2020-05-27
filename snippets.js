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

                
                
                clipContainer.appendChild(clipCard);

                // send the audio clip to the server
                var this2 = this; // TODO remove
                const snippet = parent.querySelector(".snippet-text").textContent;
                const filename = snippet+".ogg";
                var formData = new FormData();
                formData.append('action',"upload_snippet");
                formData.append("_ajax_nonce", my_ajax_obj.nonce);
                formData.append("title","foo"); // TODO remove
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
                        console.log("callback",data);
                        // make the delete button
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = "x";
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
