document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:5000/get_closet') // Use the full URL for now
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const closetDiv = document.getElementById('closetDiv');
            data.forEach(filePath => {
                const img = document.createElement('img');
                img.src = `http://localhost:5000/${filePath}`; // Explicitly set the full URL
                img.style.width = '150px';
                img.style.height = 'auto';
                img.style.margin = '10px';
                closetDiv.appendChild(img);
            });
        })
        .catch(error => {
            console.error('Error fetching closet data:', error);
        });
});