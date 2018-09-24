'use strict';

const EventEmitter = require('events');
const MongoClient = require('mongodb').MongoClient;
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
      this.bucket = new GridFSBucket(this.db);
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
    let stream = this.bucket.openDownloadStreamByName(key);
    return new Promise((resolve, reject) => {
      let resp = '';
      stream.on("data", (chunk) => {
        resp += chunk;
      });

      stream.on('end', () => {
        resolve(resp.toString("utf-8"));
      });

      stream.on("error", (err) => {
        resolve();
      });
    });
  }

  async set(key, value, ttl) {
    await this._connected;

    const expiresAt = (typeof ttl === 'number') ? new Date(Date.now() + ttl) : null;
    await this.delete(key);

    let stream = this.bucket.openUploadStream(key, {
      metadata: {
        expiresAt: expiresAt
      }
    });

    return new Promise((resolve, reject) => {
      stream.end(value);
      stream.on("finish", () => {
        resolve(stream);
      });
    });

  }

  async delete(key) {
    await this._connected;

    if (typeof key !== 'string') {
      return false;
    }

    let file = await this.bucket.find({
      filename: key
    }).next();
    if (file) {
      let resp = await this.bucket.delete(file._id);
      return true;
    }
  }

  async clearOlderThan(seconds) {
    await this._connected;

    let oldFiles = await this.bucket.find({
      "uploadDate": {
        $lte: new Date(Date.now() - (seconds * 1000))
      }
    });

    oldFiles.forEach(file => {
      this.bucket.delete(file._id);
    });

    return true;
  }

  async clearExpired() {
    await this._connected;
    let expiredFiles = await this.bucket.find({
      "metadata.expiresAt": {
        $lte: new Date(Date.now())
      }
    });

    expiredFiles.forEach(file => {
      this.bucket.delete(file._id);
    });

    return true;
  }

  async clear() {
    await this._connected;
    return this.bucket.drop();
  }
}

module.exports = KeyvMongo;