// importar dependencias

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

puppeteer.use(StealthPlugin());

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const args = process.argv.slice(2);
const accountId = args[0] || 'default';
const isSetup = args.includes('--setup');
const isHeadless = !args.includes('--no-headless');
const saveScreenshots = !args.includes('--no-screenshots');

const askLanguage = () => {
    return new Promise(resolve => {
        rl.question('🌐 Escoge el lenguaje de los posts (en/es): ', answer => {
            const lang = answer.trim().toLowerCase();
            if (lang !== 'en' && lang !== 'es') {
                console.log('❌ Opción inválida. Utilizando Español.');
                resolve('es');
            } else {
                resolve(lang);
            }
        });
    });
};

(async () => {
    const language = await askLanguage();
    rl.close();

    const POSTS_PATH = path.join(__dirname, `${language === 'es' ? 'ES_Posts.json' : 'EN_Posts.json'}`);
    const postData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
    const getRandomPost = () => {
        const posts = postData.posts;
        return posts[Math.floor(Math.random() * posts.length)];
    };

    const userDataDir = path.join(__dirname, `.profile-${accountId}`);
    const screenshotsDir = path.join(__dirname, `screenshots-${accountId}`);
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

    let screenshotIndex = 0;
    const screenshot = async (page, label) => {
        if (!saveScreenshots) return;
        const file = path.join(screenshotsDir, `${String(screenshotIndex++).padStart(2, '0')}_${label}.png`);
        await page.screenshot({ path: file });
    };

    const clickAt = async (page, x, y, label) => {
        await page.mouse.move(x, y, { steps: 20 });
        await page.mouse.click(x, y);
        await screenshot(page, `click_${label}`);
    };

    const browser = await puppeteer.launch({
        headless: isHeadless ? 'new' : false,
        defaultViewport: { width: 1280, height: 800 },
        userDataDir,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });

    const page = await browser.newPage();
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2' });
    await screenshot(page, '01_inicio');

    if (isSetup) {
        console.log(`🧠 Entrá manualmente a Threads con la cuenta ${accountId}. Luego presioná Enter.`);
        await new Promise(resolve => process.stdin.once('data', resolve));
        await screenshot(page, '02_post_login_manual');
        console.log(`✅ Login guardado. Cerrá la ventana y volvé a correr sin --setup.`);
        await browser.close();
        process.exit();
    }

    await screenshot(page, '03_validando_login_visualmente');
    console.log("🧿 Asumiendo login correcto porque no se puede verificar por DOM.");

    while (true) {
        const postText = getRandomPost();
        console.log("🧭 Iniciando nueva publicación...");

        try {
            await clickAt(page, 1210, 720, 'crear_publicacion');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await screenshot(page, 'modal_abierto');

            await clickAt(page, 500, 360, 'escribir_post');
            await page.keyboard.type(postText, { delay: 50 });
            await screenshot(page, 'texto_escrito');

            const publishYs = [490, 510, 530];
            for (let y of publishYs) {
                await clickAt(page, 890, y, `publicar_post_try_y${y}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log("✅ Publicación enviada (modo visual)");
        } catch (err) {
            console.error("❌ Error durante publicación visual:", err.message);
            await screenshot(page, '99_error');
        }

        const minutes = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        console.log(`⏳ Esperando ${minutes} minutos...`);
        await new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
    }
})();
