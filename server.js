const express = require('express');
const app = express();
const path = require('path');
const fileUpload = require('express-fileupload');


const userRoutes = require('./routes/userRoutes');


app.use(fileUpload({
  limits: { fileSize: 8 * 1024 * 1024 },
}));

require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', userRoutes);

const port = process.env.PORT || 3000;


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
