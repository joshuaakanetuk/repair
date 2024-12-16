// Import Express
const express = require('express');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// POST route
app.post('/api/data', (req, res) => {
    const { name, age } = req.body; // Extract data from the request body

    if (!name || !age) {
        return res.status(400).json({ message: 'Name and age are required!' });
    }

    // Process the data (for now, just respond with it)
    res.status(200).json({
        message: 'Data received successfully!',
        data: { name, age }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
