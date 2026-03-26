const express = require('express');
const bodyParser = require('body-parser');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api/patients', patientRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
