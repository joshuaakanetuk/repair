require('dotenv').config()
const express = require('express');
const app = express();
const nodemailer = require("nodemailer");
const { degrees, PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER || "your_email@gmail.com",
        pass: process.env.APP_PASSWORD || "your_app_password",
    },
});



// Middleware to parse JSON request bodies
app.use(express.json());

// POST route
app.post('/api/data', async (req, res) => {
    const { clientName, clientTotal, clientEmail, clientNumber, agentName, dateCreated, dateSent, dateContacted, deviceBrand, deviceModel, deviceAge, deviceSerialNumber, deviceIssue, clientEstimate, estimateLink, sendToEmails } = req.body; // Extract data from the request body
    const RENDER_VARIS = [clientName, clientTotal, clientEmail, clientNumber, agentName, dateCreated, dateSent, dateContacted, deviceBrand, deviceModel, deviceAge, deviceSerialNumber, deviceIssue, clientEstimate, estimateLink, sendToEmails ];

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
    fields.forEach((field, index) => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`Filling field: ${RENDER_VARIS[index]}`);
        form.getTextField(name).setText((RENDER_VARIS[index]));
    });

    const modifiedPdfBytes = await pdfDoc.save();

    const mailOptions = {
        from: process.env.USER,
        to: sendToEmails,
        subject: "First Look at Auto Generated PDFs",
        attachments: [
            {
                conzent: (Buffer.from(modifiedPdfBytes)),
                filename: new Date().toISOString() + ".pdf",
                type: "application/pdf",
                disposition: "attachment",
            },
        ]
    };


    try {
        await transporter.sendMail(mailOptions);
    }
    catch (e) {
        console.log(e)
    }

    // res.send(modifiedPdfBytes);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
