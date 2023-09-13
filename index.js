const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.setPrompt('Enter the url:')
rl.prompt();


// const infiniteScroll= async (page)=>{

//     while(true){

//     const prevHeight= await page.evaluate('document.body.scrollHeight');
//     await page.evaluate('window.scrollTo(0,document.body.scrollHeight)');
//     await page.waitForFunction(`document.body.scrollHeight > ${prevHeight}`);
//     await new promise ((resolve)=>setTimeout(resolve,1000));

//     }
// }
console.time('timer start')
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const initPuppeteer = async (website) => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto(website);


        await autoScroll(page);
        const getInfo = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.product-base');
            const productInfo = [];

            productElements.forEach((productElement) => {

                price = productElement.querySelector('.product-discountedPrice')?.innerText;
                title = productElement.querySelector('.product-product')?.innerText;
                imgURL = productElement.querySelector('img')?.getAttribute('src');
                pageURL = "https://www.myntra.com/" + productElement.querySelector('a')?.getAttribute('href')
                if (!imgURL) {
                    console.log('img not retrieved', productElement.querySelector('img'));
                }

                productInfo.push({ price, title, imgURL, pageURL });
            });

            return productInfo;
        });

        // console.log(getInfo);
        const myMap = new Map()
        for (const data of getInfo) {
            await page.goto(data.pageURL);



            const details = await page.evaluate(() => {

                const productDetails = document.querySelector('.pdp-product-description-content')?.innerText;

                return productDetails;



            });
            myMap.set(data.pageURL, details);
            // console.log(details);

        }
        console.timeEnd('timer start')

        await browser.close();
        myMap.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        fs.writeFile('data.json', JSON.stringify(getInfo), (err) => {
            if (err) throw err;
            console.log('json saved succesfully :)');
        })
    } catch (error) {
        console.log(error);
    }
}

(async () => {
    rl.on('line',async (website)=>{
    initPuppeteer(website)
    })
})();
//console.timeEnd('timer start')
//pdp-product-description-content