import puppeteer from "puppeteer";
import fs from "fs";

export const POST = async (req, res) => {
  try {
    const html = await req.json();
    const CSSpath = ".next/static/css/app/";
    const CSSfiles = fs
      .readdirSync(CSSpath)
      .filter((fn) => fn.endsWith(".css"));
    console.log({ CSSfiles });
    const CSScontent = fs.readFileSync(CSSpath + CSSfiles[0], "utf8");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--font-render-hinting=none",
      ],
    });

    // Create a new page
    const page = await browser.newPage();
    //Get HTML content from HTML file
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: CSScontent });
    await page.evaluateHandle("document.fonts.ready");

    // To reflect CSS used for screens instead of print
    await page.emulateMediaType("screen");
    // Downlaod the PDF
    const pdf = await page.pdf({
      path: "public/document.pdf",
      format: "A4",
      scale: 1,
      margin: {
        top: "20mm",
        left: "20mm",
        right: "20mm",
        bottom: "20mm",
      },
    });

    // Close the browser instance
    await browser.close();

    return Response.json("PDF generated.");
  } catch (error) {
    return Response.json({ error });
  }
};
