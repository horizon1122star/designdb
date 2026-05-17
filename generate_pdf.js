const fs = require('fs');
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generatePDF() {
    console.log("Reading dataflow.md...");
    const dataflowContent = fs.readFileSync('docs/dataflow.md', 'utf-8');
    
    // Add GitHub link at the top
    const fullContent = `
# Database Lab Assignment: Milestones 2 to 5

**Group Name:** DesignDB Team
**GitHub Repository:** [https://github.com/horizon1122star/designdb/tree/Features](https://github.com/horizon1122star/designdb/tree/Features)

---

${dataflowContent}
    `;

    console.log("Converting Markdown to HTML...");
    const htmlContent = marked.parse(fullContent);

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Database Lab Assignment</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
            h1, h2, h3 { color: #0056b3; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
            pre { background-color: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; page-break-inside: avoid; }
            .page-break { page-break-after: always; }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
    `;

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const outputPath = 'Group_DesignDB_Version_Control_Doc_DBLab.pdf';
    console.log(`Saving PDF to ${outputPath}...`);
    
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();
    console.log("PDF generated successfully!");
}

generatePDF().catch(console.error);
