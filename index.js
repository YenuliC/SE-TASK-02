const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

async function scrapeIkman(keyword) {
    const searchUrl = `https://ikman.lk/en/ads/sri-lanka?query=${encodeURIComponent(keyword)}`;

    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(searchUrl, { waitUntil: 'load', timeout: 0 });

        await page.waitForSelector('.normal--2QYVk', { timeout: 5000 });

        const result = await page.evaluate(() => {
            const firstResult = document.querySelector('.normal--2QYVk');
            if (!firstResult) return null;

            const name = firstResult.querySelector('.title--3yncE')?.textContent.trim() || 'No title';
            const price = firstResult.querySelector('.price--3SnqI')?.textContent.trim() || 'No price';
            const url = 'https://ikman.lk' + (firstResult.querySelector('a')?.getAttribute('href') || '');
            const location = firstResult.querySelector('.location--2-ez3')?.textContent.trim() || 'No location';
            const datePosted = firstResult.querySelector('.date--3PTDE')?.textContent.trim() || 'No date';

            return { name, price, url, location, datePosted };
        });

        return result;
    } catch (error) {
        console.error('Error scraping ikman.lk:', error);
        return null;
    } finally {
        if (browser) {
         
            await browser.close();
        }
    }
}

app.get('/search', async (req, res) => {
    const keyword = req.query.keyword;

    if (!keyword) {
        return res.status(400).json({ error: 'Please provide a keyword to search for.' });
    }

    const result = await scrapeIkman(keyword);

    if (result) {
        res.json(result);
    } else {
        res.status(500).json({ error: 'Failed to retrieve data from ikman.lk' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
