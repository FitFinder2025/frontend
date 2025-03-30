const express = require('express');
const app = express();
const port = 3000;
const path = require('path');



const cors = require('cors');
app.set('views', path.join(__dirname, 'views'));
app.use(cors());


app.use(express.static(path.join(__dirname, 'public')));



app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/aboutus', (req, res) => {
    res.render('aboutus');
  });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));



  

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
  

  