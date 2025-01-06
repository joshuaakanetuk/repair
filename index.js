require('dotenv').config()
const express = require('express');
const fs = require('fs')
const app = express();
const nodemailer = require("nodemailer");
const { degrees, PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const bwipjs = require('bwip-js');


/**
 * Returns the current date in "MM/DD" format.
 * @returns {string} The formatted date.
 */
function getCurrentDateMMDD() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(today.getDate()).padStart(2, '0');

    return `${month}/${day}`;
}

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

    const barcodeData = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: estimateLink,
        scale: 3,
        includetext: false,
        width: 100,
        height: 100
    });

    const pdfBytes = await fetch(process.env.TEMPLATE_PDF);

    if (pdfBytes.status !== 200) {
        return new Response(pdfBytes.statusText, {
            status: pdfBytes.status,
        });
    }

    const existingPdfBytes = await pdfBytes.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const barcodeImage = await pdfDoc.embedPng(barcodeData);
    const barcodeDims = barcodeImage.scale(0.5); // Adjust scale if necessary

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const w = page.getWidth();
    const h = page.getHeight();

    page.drawImage(barcodeImage, {
        x: 465, // X-coordinate for placement
        y: h - 740, // Y-coordinate for placement
        width: 100,
        height: 100,
    });

    // Basic Info
    // Ln 1
    page.drawText(clientName, { x: 25, y: h - 145, size: 14 })
    page.drawText((agentName), { x: w - 300, y: h - 145, size: 14 })
    page.drawText(getCurrentDateMMDD(), { x: w - 150, y: h - 145, size: 14 })

    // Ln 2
    page.drawText((clientTotal) ? 'Has Total' : 'Doesn\'t Have Total', { x: 25, y: h - 195, size: 14 })
    page.drawText(clientNumber, { x: w - 300, y: h - 195, size: 14 })

    // Ln 3
    page.drawText(clientEmail, { x: 25, y: h - 255, size: 14 })
    page.drawText(getCurrentDateMMDD(), { x: w - 295, y: h - 250, size: 14 })

    // Device Information
    // Ln 1
    page.drawText(deviceBrand, { x: 25, y: h - 355, size: 14 })
    page.drawText(`${deviceModel}, ${deviceAge} old.`, { x: 280, y: h - 355, size: 14 })

    // Ln 2
    page.drawText(deviceSerialNumber, { x: 25, y: h - 405, size: 14 })

    // Issue
    page.drawText(deviceIssue, { x: 25, y: h - 480, size: 14 })


    // Get the form embedded in the PDF
    // const form = pdfDoc.getForm();

    // Get all fields and fill them with text
    // const fields = form.getFields();
    // fields.forEach((field, index) => {
    //     const type = field.constructor.name;
    //     const name = field.getName();
    //     console.log(`Filling field: ${RENDER_VARIS[index]}`);
    //     form.getTextField(name).setFontSize(4)
    //     form.getTextField(name).setText(String(RENDER_VARIS[index]));
    // });

    const modifiedPdfBytes = await pdfDoc.save();
    
    const mailOptions = {
        from: process.env.USER,
        to: sendToEmails,
        subject: "First Look at Auto Generated PDFs",
        attachments: [
            {
                content: (Buffer.from(modifiedPdfBytes)),
                filename: new Date().toISOString() + ".pdf",
                type: "application/pdf",
                disposition: "attachment",
            },
        ]
    };


    try {
        // await fs.writeFileSync('pdf.pdf', modifiedPdfBytes);
        await transporter.sendMail(mailOptions);
    }
    catch (e) {
        console.log(e)
        res.status(400).send({
            message: 'This is an error!'
        });
    }
    res.send("Success");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
