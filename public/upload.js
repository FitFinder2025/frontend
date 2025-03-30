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


function triggerTransition() {
    mainContent.classList.add('shift-left');
    resultDiv.classList.add('show', 'loading');
    resultDiv.innerHTML = ''; // Clear previous results
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
                // Optionally handle the error in the UI, e.g., display a message
                // Remove loading class in case of error to prevent indefinite animation
                resultDiv.classList.remove('loading');
            } else {
                console.warn("Invalid response from Crop API");
                // Remove loading class in case of unexpected response
                resultDiv.classList.remove('loading');
            }
        })
        .catch(error => {
            console.error("Error sending image to Crop API:", error);
            // Optionally handle the error in the UI
            // Remove loading class in case of error
            resultDiv.classList.remove('loading');
        });
}

function cropAndDisplay(originalFile, cropData) {
    const reader = new FileReader();
    let imagesLoadedCount = 0;
    const totalImagesToLoad = cropData.length;
    let headingAdded = false; // Flag to track if the heading has been added

    function checkLoadingComplete() {
        if (imagesLoadedCount === totalImagesToLoad) {
            // Only remove the 'loading' class, keep the 'show' class
            resultDiv.classList.remove('loading');
            console.log("All images loaded, animation stopped.");
        }
    }

    reader.onload = function (event) {
        const originalImage = new Image();
        originalImage.onload = function () {
            const container = document.getElementById('crop');
            if (container) {
                container.innerHTML = '';
                container.style.display = 'flex';
                container.style.flexDirection = 'row';
                container.style.alignItems = 'center';
            }

            // If there are no crops, remove loading animation immediately
            if (totalImagesToLoad === 0) {
                resultDiv.classList.remove('loading');
                console.log("No crops to process, animation stopped.");
                return;
            }

            // Add the heading only once before processing crops
            if (!headingAdded) {
                let heading = document.createElement("h3");
                heading.innerText = "Matching Items in Your Closet";
                resultDiv.appendChild(heading);
                headingAdded = true;
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
                    canvas.width = originalImage.width;
                    canvas.height = cropHeight;

                    ctx.drawImage(
                        originalImage,
                        0, startY,
                        originalImage.width, cropHeight,
                        0, 0,
                        originalImage.width, cropHeight
                    );

                    canvas.toBlob(function (blob) {
                        const formData = new FormData();
                        formData.append('query_image', blob, `cropped_${category}.png`);
                        formData.append('cloth_type', category);

                        fetch('http://localhost:5000/search', {
                            method: 'POST',
                            body: formData
                        })
                            .then(response => response.json()) // Expecting a JSON object (array)
                            .then(data => {

                                console.log(`Search API Response for ${category}:`, data);
                                if (data && Array.isArray(data) && data.length > 0 && data[0].file_path) {
                                    const filePath = data[0].file_path; // Access file_path from the first element
                                    const imageUrl = `http://localhost:5000/${filePath}`;
                                    const imgElement = document.createElement('img');
                                    imgElement.src = imageUrl;
                                    imgElement.alt = category;
                                    imgElement.style.maxHeight = '150px';
                                    imgElement.style.maxWidth = '150px';
                                    imgElement.style.objectFit = 'contain';
                                    imgElement.style.margin = '5px';
                                    imgElement.style.borderRadius = '10px'
                                    imgElement.style.paddingRight = "1em"
                                    imgElement.onload = () => {
                                        imagesLoadedCount++;
                                        checkLoadingComplete();
                                    };
                                    imgElement.onerror = () => {
                                        console.warn(`Error loading image from ${imageUrl}`);
                                        imagesLoadedCount++;
                                        checkLoadingComplete();
                                    };
                                    resultDiv.appendChild(imgElement);
                                } else {
                                    console.warn(`File path not found in Search API response for ${category}`);
                                    resultDiv.innerHTML += `<p><b>${category}:</b> Error retrieving image (file path missing).</p>`;
                                    imagesLoadedCount++;
                                    checkLoadingComplete();
                                }
                            })
                            .catch(error => {
                                console.error(`Error sending ${category} to Search API:`, error);
                                resultDiv.innerHTML += `<p><b>${category}:</b> Error retrieving image.</p>`;
                                imagesLoadedCount++;
                                checkLoadingComplete();
                            });
                    }, 'image/png');


                    const croppedImage = new Image();
                    croppedImage.src = canvas.toDataURL();
                    croppedImage.alt = `Cropped ${category}`;
                    croppedImage.style.maxHeight = '80px';
                    croppedImage.style.maxWidth = '80px';
                    croppedImage.style.objectFit = 'contain';
                    croppedImage.style.marginRight = '10px';


                    const imageContainer = document.createElement('div');
                    imageContainer.style.display = 'flex';
                    imageContainer.style.flexDirection = 'column';
                    imageContainer.style.alignItems = 'center';
                    imageContainer.appendChild(croppedImage);
                    container.appendChild(imageContainer);
                } else {
                    console.warn(`Skipping crop for ${category}: Invalid height.`);
                    imagesLoadedCount++;
                    checkLoadingComplete();
                }
            });
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(originalFile);
}