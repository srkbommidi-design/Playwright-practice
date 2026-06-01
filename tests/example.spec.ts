import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.amazon.com/');
  await page.getByRole('searchbox', { name: 'Search Amazon' }).click();
  await page.getByRole('searchbox', { name: 'Search Amazon' }).fill('women clot');
  await page.goto('https://www.amazon.com/s?k=women+clothing&crid=XT7HS6R7UWHR&sprefix=women+clot%2Caps%2C608&ref=nb_sb_ss_p13n-expert-pd-ops-ranker_1_10');
  await page.getByRole('link', { name: 'DLOODA Womens Skort Tennis' }).first().click();
  await page.goto('https://www.amazon.com/gp/aw/d/B0DSPV7TF1/?_encoding=UTF8&pd_rd_plhdr=t&aaxitk=590bf35ffd9f6643b2985e017f091b59&hsa_cr_id=0&qid=1780334682&sr=1-1-9e67e56a-6f64-441f-a281-df67fc737124&ref_=sbx_s_sparkle_sbtcd_asin_0_img&pd_rd_w=sATOv&content-id=amzn1.sym.2fb72bc8-96ef-420d-b08f-c04b69f36507%3Aamzn1.sym.2fb72bc8-96ef-420d-b08f-c04b69f36507&pf_rd_p=2fb72bc8-96ef-420d-b08f-c04b69f36507&pf_rd_r=N9FB3VH0JNGHCG7RRV45&pd_rd_wg=iV7Cw&pd_rd_r=ecd9a9e1-d313-4491-9128-9bafa7d09cd2&th=1&psc=1');
  await page.getByRole('button', { name: 'DLOODA Womens Skort Tennis' }).click();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.getByRole('button', { name: 'Proceed to checkout (1 item)' }).click();
});