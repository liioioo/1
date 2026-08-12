import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find(el => el.textContent.includes('微信'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(el => el.innerHTML.includes('lucide-plus'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('添加朋友') || el.textContent.includes('添加好友') || el.textContent.includes('新建联系人'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
})();
