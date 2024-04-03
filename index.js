require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const logger = require('betterslogs');

async function ipfingerprints(ip) {

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

    try {
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

            logger.info(`IP: ${ip} | Ports: ${openPorts.map(port => port.port).join(', ')}`);
            fs.writeFile(`open_ports.txt`, `IP: ${ip} | Ports: ${openPorts.map(port => port.port).join(', ')}`, (err) => {
                if (err) {
                    logger.error(err.message);
                }
            })

        } else {
            logger.info("No port scan information available.");
        }
    } catch (error) {
        logger.error('Error scanning IP:', error.message);
    }
}


(async () => {

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

    logger.info('Anqet scan started')

    await Promise.all(list);

    logger.info('Scan completed')
    process.exit(0);
})()
