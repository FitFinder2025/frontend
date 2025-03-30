document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:5000/get_closet') // Use the full URL for now
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const closetDiv = document.getElementById('closetDiv');

            // Add styles to make the closetDiv horizontal
            closetDiv.style.display = 'flex';
            closetDiv.style.flexDirection = 'row';
            closetDiv.style.flexWrap = 'wrap'; // Optional: Allows items to wrap to the next line if there are too many
            closetDiv.style.gap = '10px'; // Optional: Adds spacing between the cards

            data.forEach(filePath => {
                // Create a card div
                const card = document.createElement('div');
                card.classList.add('card'); // Add Bootstrap card class for basic styling
                card.style.width = '150px'; // Set the desired width for the card
                card.style.height = '150px'; // Set the desired height for the card (adjust as needed)
                card.style.margin = '0'; // Remove the margin from individual cards as we are using gap on the container
                card.style.overflow = 'hidden'; // Ensure images within the fixed size card don't overflow
                card.style.display = 'flex';
                card.style.justifyContent = 'center';
                card.style.alignItems = 'center';

                // Create the image element
                const img = document.createElement('img');
                img.src = `http://localhost:5000/${filePath}`;
                img.style.maxWidth = '100%'; // Make image responsive within the card
                img.style.maxHeight = '100%'; // Make image responsive within the card
                img.style.objectFit = 'contain'; // Or 'cover' depending on desired effect

                // Append the image to the card
                card.appendChild(img);

                // Append the card to the closet div
                closetDiv.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching closet data:', error);
        });
});

// --- File upload functionality ---
const uploadFile = document.getElementById('upload-file');
const uploadMessage = document.getElementById('upload-message'); // Make sure this is defined

if (uploadFile) { // Ensure the upload button exists on the page
    uploadFile.addEventListener('change', function() {
        const file = this.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            fetch('http://localhost:5000/closet', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.text()) // Expecting text response from /closet
            .then(data => {
                console.log('Upload successful:', data);
                uploadMessage.textContent = data; // Display success message
                window.location.reload(); // Reload the page after successful upload
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                uploadMessage.textContent = 'Error uploading file.';
            });
        }
    });
}

