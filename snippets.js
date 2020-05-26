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
                var formData = new FormData();
                formData.append('action',"upload_snippet");
                formData.append("_ajax_nonce", my_ajax_obj.nonce);
                formData.append("title","foo");
                // TODO think long and hard about whether this cretes a vuln
                const filename = parent.querySelector(".snippet-text").textContent+".ogg";
                formData.append("snippet_blob",blob,filename);
                jQuery.ajax({
                    url: my_ajax_obj.ajax_url,
                    type: "POST",
                    data : formData,
                    processData: false,
                    contentType: false,
                    success: function(data) {
                        console.log("callback",data);
                    }
                });
                            // {
		//    _ajax_nonce: my_ajax_obj.nonce,
		// 	action: "upload_snippet",
	  	//     title: "foo",
                //     snippet_blob: blob
  		// }
                //             , function(data) {	
                //     console.log("callback",data)
		// });
                // TODO switch over to XMLHttpRequest and eliminate jQuery dependency.
                // The reason the below code doesn't work is that admin-ajax doesn't support
                // a Content-Type of application/json; instead everything needs url-encoded.
                // var request = new XMLHttpRequest();
                // request.open('POST', my_ajax_obj.ajax_url, true);
                // request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;');
                // //request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                // request.withCredentials = true;
                // request.onload = function() {
                //     if (this.status >= 200 && this.status < 400) {
                //         console.log("upload success",this);
                //         console.log("this.response", this.response);
                //     }
                //     else {
                //         console.log("Upload failed",this);
                //         console.log("this.response", this.response);
                //     }
                // }
                // var data = {
		//    _ajax_nonce: my_ajax_obj.nonce,
		// 	action: "upload_snippet"
  		// };
                // console.log("sending ",data);
		// request.send(JSON.stringify(data));
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

