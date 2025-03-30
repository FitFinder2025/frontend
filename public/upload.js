const dropArea = document.querySelector(".hero");
const inputFile = document.querySelector("#input-file");
const imageView = document.querySelector("#img-view");
const bgImage = document.querySelector("#bg");
const placeholderText = imageView.querySelector("p");
const resultDiv = document.getElementById('result');
const closetDiv = document.getElementById("closet")

        inputFile.addEventListener("change", uploadAndCropImage);
        dropArea.addEventListener("paste", handlePaste);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropArea.classList.add('drag-over');
        }

        function unhighlight(e) {
            dropArea.classList.remove('drag-over');
        }

        dropArea.addEventListener('drop', handleDrop, false);

        function uploadAndCropImage() {
            console.log("uploadAndCropImage function called (file input)");
            console.log("inputFile.files:", inputFile.files);
            if (inputFile.files && inputFile.files[0]) {
                const file = inputFile.files[0];
                displayImage(file);
                sendImageToCropAPI(file);

                triggerTransition();
            } else {
                console.log("No file selected");
                resetImageView();
            }
        }

        function handlePaste(event) {
            console.log("Paste event triggered");
            const items = (event.clipboardData || event.clipboardData).items;
            let foundImage = false;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    event.preventDefault();
                    const pastedImageFile = item.getAsFile();
                    console.log("Pasted image file:", pastedImageFile);
                    displayImage(pastedImageFile);
                    sendImageToCropAPI(pastedImageFile);
                    foundImage = true;

                    triggerTransition();
                    break;
                }
            }
            if (!foundImage) {
                console.log("No image data found in clipboard.");
            }
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            console.log("Dropped files:", files);

            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    displayImage(file); // Display the full image first
                    sendImageToCropAPI(file);

                    triggerTransition();
                } else {
                    console.log("Dropped file is not an image.");
                    // Optionally provide user feedback (e.g., a message)
                }
            }
        }

        function displayImage(file) {
            const imgLink = URL.createObjectURL(file);
            bgImage.src = imgLink;
            bgImage.style.display = "block";
            if (placeholderText) {
                placeholderText.style.display = "none";
            }
            imageView.style.border = "none";
            imageView.style.justifyContent = "center";
            imageView.style.alignItems = "center";
            imageView.style.background = "transparent";
        }

        function resetImageView() {
            bgImage.style.display = "none";
            if (placeholderText) {
                placeholderText.style.display = "block";
            }
            imageView.style.border = "2px dashed black";
            imageView.style.background = "#f7f8ff";
            // Remove any previously cropped images
            const croppedImagesContainer = document.getElementById('cropped-images-container');
            if (croppedImagesContainer) {
                croppedImagesContainer.remove();
            }
        }
        const mainContent = document.getElementById('main-content');
        

        function triggerTransition()
        {
    
            mainContent.classList.add('shift-left');
            resultDiv.classList.add('show');
        }

        function sendImageToCropAPI(file) {
            const formData = new FormData();
            formData.append('image', file);

            fetch('http://localhost:5000/crop', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Crop API Response (raw):", data); // Log the entire response
                    if (data && data.crop) {
                        console.log("Crop Data:", data.crop); // Log the crop array specifically
                        cropAndDisplay(file, data.crop);
                    } else if (data && data.error) {
                        console.error("Error from Crop API:", data.error);
                    } else {
                        console.warn("Invalid response from Crop API");
                    }
                })

                .catch(error => {
                    console.error("Error sending image to Crop API:", error);
                });
        }

        function cropAndDisplay(originalFile, cropData) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const originalImage = new Image();
                originalImage.onload = function () {
                    const container = document.getElementById('crop');
                    if (container) {
                        container.innerHTML = ''; // Clear previous cropped images
                        container.style.display = 'flex'; // Ensure it's a flex container
                        container.style.flexDirection = 'row'; // Display items in a row
                        container.style.alignItems = 'center'; // Align items vertically
                    }

                    cropData.forEach(cropInfo => {
                        const category = cropInfo.category;
                        const startYPercentage = cropInfo.start_y;
                        const endYPercentage = cropInfo.end_y;

                        const imageHeight = originalImage.height;
                        const startY = Math.round((startYPercentage / 100) * imageHeight);
                        const endY = Math.round((endYPercentage / 100) * imageHeight);
                        const cropHeight = endY - startY;

                        if (cropHeight > 0) {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = originalImage.width; // Keep the original width
                            canvas.height = cropHeight;

                            // Draw the cropped section onto the canvas
                            ctx.drawImage(
                                originalImage,
                                0, startY, // Source X, Source Y
                                originalImage.width, cropHeight, // Source Width, Source Height
                                0, 0, // Destination X, Destination Y
                                originalImage.width, cropHeight // Destination Width, Destination Height
                            );

                            canvas.toBlob(function (blob) {
                                const formData = new FormData();
                                formData.append('query_image', blob, `cropped_${category}.png`);
                                formData.append('cloth_type', category);
                            
                                fetch('http://localhost:5000/search', {
                                    method: 'POST',
                                    body: formData
                                })
                                    .then(response => { // Rename 'data' to 'response' for clarity
                                        console.log(`Search API Response for ${category}:`, response);
                                        return response.text(); // Get the response body as text
                                    })
                                    .then(url => { // 'url' will contain the plain text URL returned by Flask
                                        console.log(`URL for ${category}:`, "localhost:5000/"+url);
                                        resultDiv.innerHTML += `<p><b>${category}:</b> URL: <a href="${url}" target="_blank">${url}</a></p>`
                                        resultDiv.innerHTML+= `<img src=${"http://localhost:5000"+url} >`;
                                    })
                                    .catch(error => {
                                        console.error(`Error sending ${category} to Search API:`, error);
                                        resultDiv.innerHTML += `<p><b>${category}:</b> Error sending to search API.</p>`;
                                    });
                            }, 'image/png');
                            

                            const croppedImage = new Image();
                            croppedImage.src = canvas.toDataURL();
                            croppedImage.alt = `Cropped ${category}`;
                            croppedImage.style.maxHeight = '80px'; // Limit height
                            croppedImage.style.maxWidth = '80px';  // Limit width
                            croppedImage.style.objectFit = 'contain'; // Ensure full image is visible
                            croppedImage.style.marginRight = '10px'; // Add spacing between images

                            const label = document.createElement('p');
                            label.textContent = category;
                            label.style.fontSize = '0.8em';
                            label.style.textAlign = 'center';
                            label.style.whiteSpace = 'nowrap';

                            const imageContainer = document.createElement('div');
                            imageContainer.style.display = 'flex';
                            imageContainer.style.flexDirection = 'column';
                            imageContainer.style.alignItems = 'center';
                            imageContainer.appendChild(croppedImage);
                            imageContainer.appendChild(label);
                            container.appendChild(imageContainer);
                        } else {
                            console.warn(`Skipping crop for ${category}: Invalid height.`);
                        }
                    });
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(originalFile);
        }


   