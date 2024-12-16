// Import Express
const express = require('express');
const app = express();
const {  degrees, PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Middleware to parse JSON request bodies
app.use(express.json());

// POST route
app.post('/api/data', async (req, res) => {
    const { name, age } = req.body; // Extract data from the request body

    const pdfBytes = await fetch(process.env.TEMPLATE_PDF);

    if (pdfBytes.status !== 200) {
      return new Response(pdfBytes.statusText, {
        status: pdfBytes.status,
      });
    }
  
    const existingPdfBytes = await pdfBytes.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
    // Get the form embedded in the PDF
    const form = pdfDoc.getForm();
  
    // Get all fields and fill them with text
    const fields = form.getFields();
    fields.forEach((field) => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`Filling field: ${name}`);
      form.getTextField(name).setText("Hello, World!");
    });
  
    const modifiedPdfBytes = await pdfDoc.save();

    res.send(modifiedPdfBytes);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
