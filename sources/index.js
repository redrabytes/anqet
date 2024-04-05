require('dotenv').config();

const axios = require('axios');
const logger = require('betterslogs');

async function urlhaus() {

    const env_tags = process.env.URLHAUS_TAGS.split(',');
    const ignore_tag = process.env.URLHAUS_IGNORE_TAGS.split(',');

    var list = [];

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Content-Type": "application/json"
    }

    try {
        const response = await axios.get('https://urlhaus.abuse.ch/downloads/json_online/', { headers });
        var data = response.data;
    } catch (error) {
        logger.error(error);
    }

    const item_num = Object.keys(data);

    for (const item in item_num) {
        const item_data = data[item_num[item]][0];
        const tags = item_data.tags;

        if (tags && tags.some(tag => env_tags.includes(tag) && !env_tags.includes(ignore_tag))) {

            const url = new URL(item_data.url);
            const payload = item_data.url;
            const date_added = item_data.dateadded;
            const last_online = item_data.last_online;

            list.push({ url: url.hostname, payload_location: payload, dateadded: date_added, last_online: last_online });
        }
    }

    return list;
}


async function all() {
    logger.info(`Scrapper started`)

    const urlhaus_data = await urlhaus();

    return urlhaus_data
}

module.exports.urlhaus = urlhaus;
module.exports.all = all;