/* eslint-disable no-param-reassign, no-console */

const fs = require('graceful-fs');
const converter = require('json-2-csv');
const SHA256 = require('crypto-js/sha256');
let episodes = require('../dev/episodes');

// eslint-disable-next-line no-unused-vars
const checkOrder = (order, obj, episodeArr, arrIndex) => {
  const keys = Object.keys(obj);
  if (order.length !== keys.length) {
    console.log(`${obj.title}: incorrect number of keys`);
    process.exit(1);
  }

  order.forEach((key, index) => {
    if (key !== keys[index]) {
      console.log(`${obj.title}: ${keys[index]} is not in the correct order`);
      process.exit(1);
    }
  });
};

episodes.youtube.forEach((item, index) => {
  checkOrder([
    'source',
    'title',
    'releaseDate',
    'links',
    'aliases',
    'runtime',
  ],
  item,
  episodes.youtube,
  index);

  for (let i = 0; i < item.links.length; i += 1) {
    if (item.links[i].link.includes('youtube') || item.links[i].link.includes('wistia')) {
      //
    } else {
      item.links = {};
    }
  }
});

episodes.patreon.forEach((item, index) => {
  checkOrder([
    'source',
    'title',
    'releaseDate',
    'link',
    'wistiaTitles',
    'patreonTitles',
    'pass',
    'stream',
    'runtime',
    'availability',
  ],
  item,
  episodes.patreon,
  index);

  if (item.link) {
    const parts = item.link.split('/');
    parts[parts.length - 1] = SHA256(parts[parts.length - 1]).toString();
    item.link = parts.join('/');
  }

  delete item.pass;
  delete item.stream;
});

require('any-date-parser');

const sortDates = (type) => {
  episodes[type] = episodes[type].sort((a, b) => {
    const date1 = a.releaseDate ? (Date.fromString(a.releaseDate)).getTime() : 0;
    const date2 = b.releaseDate ? (Date.fromString(b.releaseDate)).getTime() : 0;
    return date1 - date2;
  });
};
sortDates('youtube');
sortDates('patreon');

episodes = {
  totalCount: episodes.youtube.length + episodes.patreon.length,
  youtubeCount: {
    total: episodes.youtube.length,
    totalLinks: episodes.youtube.filter((row) => JSON.stringify(row.links).includes('youtube')).length,
    totalLinksAvailable: episodes.youtube.filter((row) => JSON.stringify(row.links).includes('Available')).length,
  },
  patreonCount: {
    total: episodes.patreon.length,
    totalLinks: episodes.patreon.filter((row) => row.link.includes('wistia')).length,
    totalLinksAvailable: episodes.patreon.filter((row) => row.availability === 'Available').length,
  },
  ...episodes,
};

const json = (JSON.stringify(episodes, null, 4));
fs.writeFileSync('./data/episodes.json', json);

const writeCsv = (type) => {
  converter.json2csv(episodes[type], (err, csv) => {
    if (err) {
      throw err;
    }

    // print CSV string
    // console.log(csv);
    fs.writeFileSync(`./data/${type}.csv`, csv);
  });
};

writeCsv('youtube');
writeCsv('patreon');
