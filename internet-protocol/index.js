const logger = require('betterslogs');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const { countryCodeEmoji } = require('country-code-emoji');

const commonPorts = [
    { port: 20, service: 'FTP' },
    { port: 21, service: 'FTP' },
    { port: 22, service: 'SSH' },
    { port: 23, service: 'Telnet' },
    { port: 25, service: 'SMTP' },
    { port: 53, service: 'DNS' },
    { port: 80, service: 'HTTP' },
    { port: 110, service: 'POP3' },
    { port: 115, service: 'SFTP' },
    { port: 123, service: 'NTP' },
    { port: 143, service: 'IMAP' },
    { port: 161, service: 'SNMP' },
    { port: 194, service: 'IRC' },
    { port: 443, service: 'SSL/HTTPS' },
    { port: 445, service: 'SMB' },
    { port: 465, service: 'SMTPS' },
    { port: 554, service: 'RTSP' },
    { port: 873, service: 'RSYNC' },
    { port: 993, service: 'IMAPS' },
    { port: 995, service: 'POP3S' },
    { port: 3389, service: 'RDP' },
    { port: 5631, service: 'PC Anywhere' },
    { port: 3306, service: 'MySQL' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 5900, service: 'VNC' },
    { port: 6379, service: 'Redis' },
    { port: 8333, service: 'Bitcoin' },
    { port: 11211, service: 'Memcached' },
    { port: 25565, service: 'Minecraft' }
];

const botnetPorts = [
    /* 
        ...
    */
];

module.exports.save = (data) => {
    var today = new Date();
    today = today.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    if (!fs.existsSync('logs/anqet.log')) fs.writeFileSync('logs/anqet.log', `Date: ${today}\n\n`, 'utf-8', (err) => { if (err) throw err });
    if (fs.existsSync('logs/anqet.log')) {
        const regex = /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/;
        const fileContent = fs.readFileSync('logs/anqet.log', 'utf-8');
        const dateString = String(fileContent.match(regex)[0]).split(' ')[0].replace(/\//g, '-');
        console.log(dateString)

        today = today.split(' ')[0].replace(/\//g, '-');
        console.log(today)

        if (dateString !== today) {
            fs.renameSync('logs/anqet.log', `logs/anqet.log.${dateString}`);
            fs.writeFileSync('logs/anqet.log', `Date: ${today}\n\n${data}`, 'utf-8', (err) => { if (err) throw err });
        } else {
            fs.appendFile('logs/anqet.log', data, 'utf-8', (err) => { if (err) throw err });
        }

    }
}

module.exports.info = async (ip) => {

    async function ipapi_dot_com(ip) {
        const lookup = await axios.get(`http://ip-api.com/json/${ip}`);

        const ipinfo = {
            country: lookup.data['country'] || 'N/A',
            countryCode: lookup.data['countryCode'] || 'N/A',
            region: lookup.data['regionName'] || 'N/A',
            city: lookup.data['city'] || 'N/A',
            lat: lookup.data['lat'] || 'N/A',
            lon: lookup.data['lon'] || 'N/A',
            isp: lookup.data['isp'] || 'N/A',
            as: lookup.data['as'] || 'N/A'
        }

        return ipinfo;
    }

    async function ipinfo_dot_io(ip) {
        const lookup = await axios.get(`https://ipinfo.io/${ip}/json`);

        const ipinfo = {
            city: lookup.data['city'] || 'N/A',
            region: lookup.data['region'] || 'N/A',
            country: lookup.data['country'] || 'N/A',
            loc: lookup.data['loc'] || 'N/A',
            org: lookup.data['org'] || 'N/A',
        }

        return ipinfo;
    }

    var data = '';

    data = await ipapi_dot_com(ip);

    while (!data) {
        data = await ipinfo_dot_io(ip);
    }

    return data
}


module.exports.portScan = async (ip, payload) => {

    return new Promise((resolve, reject) => {
        exec(`rustscan --range 1-65535 -a ${ip} -g --`, async (err, stdout, stderr) => {
            if (err || stderr || ip.length === 0) {
                logger.error(err || stderr || 'No IP provided')
                return reject();
            }

            const port = stdout.split(' -> ')[1];

            var commonOpenPorts = '';
            var uncommonOpenPorts = '';

            if (port) {
                let ports_list = port.match(/\b\d+\b/g).map(Number);

                var info = await this.info(ip);

                commonOpenPorts = ports_list.filter(port => commonPorts.some(commonPort => commonPort.port === port)).map(port => ({ port }));
                uncommonOpenPorts = ports_list.filter(port => !commonPorts.some(commonPort => commonPort.port === port)).map(port => ({ port }));

                commonOpenPorts = commonOpenPorts.map(port => `${port.port} (${commonPorts.find(commonPort => commonPort.port === port.port).service})`).join(', ');
                uncommonOpenPorts = uncommonOpenPorts.map(port => port.port).join(', ');
            }

            if (!info) {
                while (!info) {
                    info = await this.info(ip);
                }
            }

            commonOpenPorts = commonOpenPorts || 'No common ports found';
            uncommonOpenPorts = uncommonOpenPorts || 'No uncommon ports found';

            logger.info(`IP: ${ip} (Payload: ${payload})`);
            logger.info(`AS: ${info.as} (${info.isp})`);
            logger.info(`Country: ${countryCodeEmoji(info.countryCode)}  (${info.country}, ${info.countryCode})`);
            logger.info(`Region: ${info.region}`);
            logger.info(`City: ${info.city}`);
            logger.info(`Lat: ${info.lat}`);
            logger.info(`Lon: ${info.lon}`);
            logger.info(``);
            logger.info(`Common Ports: ${commonOpenPorts}`);
            logger.info(`Uncommon Ports: ${uncommonOpenPorts}`);
            logger.info(`--------------------`)

            var date = new Date();
            date = date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

            const data = `IP: ${ip}` +
                `\nAS: ${info.as} (${info.isp})` +
                `\nCountry: ${countryCodeEmoji(info.countryCode)}  (${info.country}, ${info.countryCode})` +
                `\nRegion: ${info.region}` +
                `\nCity: ${info.city}` +
                `\nLat: ${info.lat}` +
                `\nLon: ${info.lon}` +
                `\n` +
                `\nCommon Ports: ${commonOpenPorts}` +
                `\nUncommon Ports: ${uncommonOpenPorts}` +
                `\n--------------------\n`;

            this.save(data);

            resolve();
        });
    });
};
