require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const logger = require('betterslogs');
const { countryCodeEmoji } = require('country-code-emoji');

async function ipinfo(ip) {
    try {
        const lookup = await axios.get(`http://ip-api.com/json/${ip}`);

        const ipinfo = {
            country: lookup.data['country'] || 'N/A',
            countryCode: lookup.data['countryCode'] || 'N/A',
            region: lookup.data['region_name'] || 'N/A',
            city: lookup.data['city'] || 'N/A',
            lat: lookup.data['lat'] || 'N/A',
            lon: lookup.data['lon'] || 'N/A',
            isp: lookup.data['isp'] || 'N/A',
            as: lookup.data['as'] || 'N/A'
        }

        return ipinfo
    } catch (err) {
        logger.error(err)
    }
}
async function ipfingerprints(ip) {
    try {

        const headers = {
            "User-Agent": "Anqet Tool 1.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://www.ipfingerprints.com",
            "Connection": "keep-alive",
            "Referer": "https://www.ipfingerprints.com/portscan.php",
            "Cookie": "cookiesAccepted=default",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin'"
        };

        const response = await axios.post('https://www.ipfingerprints.com/scripts/getPortsInfo.php', `remoteHost=${ip}&start_port=1&end_port=65535&normalScan=Yes&scan_type=connect&ping_type=none`, { headers });

        if (response.data && response.data.portScanInfo) {
            let openPorts = [];
            const portsInfo = response.data.portScanInfo;
            const regex = /(\d+)\/tcp\s+<span class="(\w+)"/g;
            const ports = portsInfo.match(regex);

            if (!ports) return;

            for (let i = 0; i < ports.length; i++) {
                const port = ports[i].replace(regex, '$1');
                const status = ports[i].replace(regex, '$2');
                if (status === 'fail') {
                    return;
                }
                openPorts.push({ port: port, status: status });
            }

            const info = await ipinfo(ip);

            logger.info(`IP: ${ip}`)
            logger.info(`AS: ${info.as} (${info.isp})`)
            logger.info(`Country: ${countryCodeEmoji(info.countryCode)}  (${info.country}, ${info.countryCode})`)
            logger.info(`Region: ${info.region}`)
            logger.info(`City: ${info.city}`)
            logger.info(`Lat: ${info.lat}`)
            logger.info(`Lon: ${info.lon}`)
            logger.info(``)
            logger.info(`Ports: ${openPorts.map(port => port.port).join(', ')}`);
            logger.info(`----------`)

            fs.appendFileSync(`open_ports.txt`, `IP: ${ip} | Ports: ${openPorts.map(port => port.port).join(', ')}\n`, (err) => {
                if (err) {
                    logger.error(err.message);
                }
            })

        } else {
            logger.info("No port scan information available.");
        }
    } catch (err) {
        logger.error(`Error occured whiled trying to scan ports: ${err.message}`)
    }
}


(async () => {

    if (fs.existsSync('open_ports.txt')) {
        logger.info('Moving old scanned URLs to \'old_open_ports.txt\'...')

        const open_ports = fs.readFileSync('open_ports.txt', 'utf-8');
        if (!fs.existsSync('old_open_ports.txt')) fs.writeFileSync('old_open_ports.txt', '', 'utf-8', (err) => { if (err) throw err })

        fs.appendFile('old_open_ports.txt', open_ports, 'utf-8', (err) => { if (err) throw err });
        fs.writeFile('open_ports.txt', '', 'utf-8', (err) => { if (err) throw err });
    }

    const list = [];
    const urls = new Set();
    const env_tags = process.env.TAGS.split(',');
    const ignore_tag = process.env.IGNORE_TAGS.split(',');

    const response = await axios.get('https://urlhaus.abuse.ch/downloads/json_online/');
    const data = response.data;
    const item_num = Object.keys(data);

    for (const item in item_num) {
        let int = 0;
        const tags = data[item_num[item]][0].tags;

        if (tags && tags.some(tag => env_tags.includes(tag) && !env_tags.includes(ignore_tag))) {
            const url = new URL(data[item_num[item]][0].url);
            urls.add(url.hostname);
        }
    }

    for (let i = 0; i < urls.size; i++) {
        const url = Array.from(urls)[i];
        list.push(ipfingerprints(url));
    }

    logger.info('Anqet scan started');

    await Promise.all(list);

    logger.info('Scan completed')
    process.exit(0);
})()
