const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

app.set('view engine', 'ejs')
const cors = require('cors');
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) =>
{
    res.render('index');
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
  