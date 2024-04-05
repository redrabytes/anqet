const argparse = require('argparse');
const logger = require('betterslogs')
const sources = require('./sources');
const internet_protocol = require('./internet-protocol')

const parser = new argparse.ArgumentParser({
    add_help: true,
    description: 'This project, currently in beta version, aims to detect and expose the command and control servers of botnets in order to take further action, such as blocking or shutting them down.'
});

parser.add_argument('-s', '--source', { help: 'Source to scrape', default: 'ALL' });
parser.add_argument('--disable-portscan', { help: 'Disable port scanning', default: false });

const args = parser.parse_args();

(async () => {

    let data;
    const ip_list = new Set();

    const source = String(args.source).toLocaleUpperCase();
    const portscan = Boolean(args.disable_portscan);

    const Promises_list = [];

    switch (source) {
        case 'ALL':
            data = await sources.all();
            break;
        case 'URLHAUS':
            data = await sources.urlhaus();
            break;
    }

    for (const item in data) {
        const ip = data[item].url;
        const ip_regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
        const domain_regex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/;

        if (ip.match(ip_regex) || ip.match(domain_regex)) {
            ip_list.add({ ip: ip, payload: data[item].payload_location });
        } else {
            continue;
        }
    }

    logger.info(`Found ${ip_list.size} IPs (Source: ${source})`);
    logger.info(``)

    if (!portscan) {
        for (const ip of ip_list) {
            Promises_list.push(internet_protocol.portScan(ip.ip, ip.payload));
            if (Promises_list.length >= 5 || ip_list.size === (Promises_list.length - 1)) {
                await Promise.all(Promises_list);
                Promises_list.length = 0;
            }
        }
    }

    logger.info(`Execution completed`)
})()