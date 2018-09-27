# keyv-mongo-gridfs [<img width="100" align="right" src="https://rawgit.com/lukechilds/keyv/master/media/logo.svg" alt="keyv">](https://github.com/lukechilds/keyv)

> MongoDB storage adapter for Keyv with GridFS support

[![Build Status](https://travis-ci.org/gumlet/keyv-mongo-gridfs.svg?branch=master)](https://travis-ci.org/gumlet/keyv-mongo-gridfs)

MongoDB storage adapter for [Keyv](https://github.com/lukechilds/keyv).

This adapter is written to support [Mongodb GridFS](https://docs.mongodb.com/manual/core/gridfs/). It stores all values in MongoDB GridFS. Values can be either string, buffer or json serializable objects.

Uses TTL indexes to automatically remove expired documents. However, TTL is not natively supported for GridFS by MongoDB so TTL is implemented with `clearExpired()` function by this library. You use `setInterval` on `clearExpired()` function to automatically remove expired files from GridFS. You decide the interval at which you want to run it.

This module also provides `clearOlderThan(seconds)` method to clear files which are older than time given in seconds. For example if you want to clear files older than 1 day, you can run `clearOlderThan(86400)`.

## Install

```shell
npm install --save keyv keyv-mongo-gridfs
```

## Usage

```js
const Keyv = require('keyv');

const keyv = new Keyv('mongodb://user:pass@localhost:27017');
keyv.on('error', handleConnectionError);
```

You can specify the database name, by default `'keyv-file-cache'` is used.

e.g:

```js
const keyv = new Keyv('mongodb://user:pass@localhost:27017', { db: 'example-keyv-cache', readPreference: "primary" });
```

## License

MIT © Aditya Patadia
