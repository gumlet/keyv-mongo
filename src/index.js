'use strict';

const LRU = require("quick-lru"),
  MongoClient = require('mongodb').MongoClient,
  GridFSBucket = require('mongodb').GridFSBucket;

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
      db: "keyv-file-cache",
      readPreference: "primary",
      lruSize: 10
    }, opts);

    if (this.opts.lruSize) {
      this.lru = new LRU({
        maxSize: this.opts.lruSize
      });
    }

    this._connected = this.connect();
  }

  async connect() {
    if (!this.db) {
      this.client = await MongoClient.connect(this.opts.url, {
        useNewUrlParser: true
      });
      this.db = this.client.db(this.opts.db);
      this.bucket = new GridFSBucket(this.db, {
        readPreference: this.opts.readPreference
      });
      this.db.collection("fs.files").createIndex({
        filename: 1,
        uploadDate: -1
      });
      this.db.collection("fs.files").createIndex({
        "metadata.expiresAt": 1
      });
      this.db.collection("fs.files").createIndex({
        "metadata.lastAccessed": 1
      });
    }
    return true;
  }

  async get(key) {
    let self = this;
    if (this.lru && this.lru.has(key)) {
      return this.lru.get(key);
    }

    await this._connected;

    this.db.collection("fs.files").updateOne({
      filename: key
    }, {
      "$set": {
        "metadata.lastAccessed": new Date()
      }
    });


    let stream = this.bucket.openDownloadStreamByName(key);
    return new Promise((resolve, reject) => {
      let resp = [];
      stream.on("error", (err) => {
        resolve();
      });

      stream.on('end', () => {
        resp = Buffer.concat(resp).toString("utf-8");
        if (self.lru) {
          self.lru.set(key, resp);
        }
        resolve(resp);
      });

      stream.on("data", (chunk) => {
        resp.push(chunk);
      });

    });

  }

  async set(key, value, ttl) {
    await this._connected;

    const expiresAt = (typeof ttl === 'number') ? new Date(Date.now() + ttl) : null;
    await this.delete(key);

    let stream = this.bucket.openUploadStream(key, {
      metadata: {
        expiresAt: expiresAt,
        lastAccessed: new Date()
      }
    });

    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        resolve(stream);
      });
      stream.end(value);
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

  async clearUnusedFor(seconds) {
    await this._connected;

    let oldFiles = await this.bucket.find({
      "metadata.lastAccessed": {
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