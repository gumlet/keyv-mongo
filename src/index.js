'use strict';

const EventEmitter = require('events');
const MongoClient = require('mongodb').MongoClient;
const GridStore = require('mongodb').GridStore;
const GridFSBucket = require('mongodb').GridFSBucket;

class KeyvMongo {
  constructor(opts) {
    opts = opts || {};
    if (typeof opts === 'string') {
      opts = {
        url: opts
      };
    }
    if (opts.uri) {
      opts = Object.assign({
        url: opts.uri
      }, opts);
    }
    this.opts = Object.assign({
      url: 'mongodb://127.0.0.1:27017',
      db: "keyv-file-cache"
    }, opts);

    this._connected = this.connect();
  }

  async connect() {
    if (!this.db) {
      this.client = await MongoClient.connect(this.opts.url, {
        useNewUrlParser: true
      });
      this.db = this.client.db(this.opts.db);
      this.db.collection("fs.files").createIndex({
        "metadata.expiresAt": 1
      });
      this.db.collection("fs.files").createIndex({
        "uploadDate": 1
      });
    }
    return true;
  }

  async get(key) {
    await this._connected;
    let bucket = new GridFSBucket(this.db);
    let file = await bucket.find({
      filename: key
    }).next();
    if (!file) {
      return undefined;
    }

    let resp = await GridStore.read(this.db, key);
    return resp.toString("utf-8");
  }

  async set(key, value, ttl) {
    await this._connected;

    const expiresAt = (typeof ttl === 'number') ? new Date(Date.now() + ttl) : null;

    let gridStore = new GridStore(this.db, key, "w", {
      metadata: {
        expiresAt: expiresAt
      }
    });
    gridStore = await gridStore.open();
    gridStore = await gridStore.write(value);
    return gridStore.close();
  }

  async delete(key) {
    await this._connected;

    if (typeof key !== 'string') {
      return false;
    }


    let bucket = new GridFSBucket(this.db);
    let file = await bucket.find({
      filename: key
    }).next();
    if (file) {
      bucket.delete(file._id);
    }
    return true;
  }

  async clearOlderThan(seconds) {
    await this._connected;

    let bucket = new GridFSBucket(this.db);
    let oldFiles = await bucket.find({
      "uploadDate": {
        $lte: new Date(Date.now() - (seconds * 1000))
      }
    });

    oldFiles.forEach(file => {
      bucket.delete(file._id);
    });

    return true;
  }

  async clearExpired() {
    await this._connected;

    let bucket = new GridFSBucket(this.db);
    let expiredFiles = await bucket.find({
      "metadata.expiresAt": {
        $lte: new Date(Date.now())
      }
    });

    expiredFiles.forEach(file => {
      bucket.delete(file._id);
    });

    return true;
  }

  async clear() {
    await this._connected;
    var bucket = new GridFSBucket(this.db);
    return bucket.drop();
  }
}

module.exports = KeyvMongo;