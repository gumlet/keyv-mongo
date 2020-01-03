# keyv-mongo-gridfs [<img width="100" align="right" src="https://rawgit.com/lukechilds/keyv/master/media/logo.svg" alt="keyv">](https://github.com/lukechilds/keyv)

> MongoDB storage adapter for Keyv with GridFS support

[![Build Status](https://travis-ci.org/gumlet/keyv-mongo-gridfs.svg?branch=master)](https://travis-ci.org/gumlet/keyv-mongo-gridfs)

MongoDB storage adapter for [Keyv](https://github.com/lukechilds/keyv).

This adapter is written to support [Mongodb GridFS](https://docs.mongodb.com/manual/core/gridfs/). It stores all values in MongoDB GridFS. Values can be either string, buffer or json serializable objects.

Uses TTL indexes to automatically remove expired documents. However, TTL is not natively supported for GridFS by MongoDB so TTL is implemented with `clearExpired()` function by this library. You use `setInterval` on `clearExpired()` function to automatically remove expired files from GridFS. You decide the interval at which you want to run it.

This module also provides `clearUnusedFor(seconds)` method to clear files which not accessed for certain files. For example if you want to clear files not used in last 1 day, you can run `clearUnusedFor(86400)`.

## Install

```shell
npm install --save keyv keyv-mongo-gridfs
```

## Usage

```js 

// How to use this adapter
import Keyv from 'keyv'
import MongoAdapter from 'keyv-mongo-gridfs'

const store = new MongoAdapter({
  url: process.env.MONGO_CONNECTION_STRING,
  db: 'some-db',
  readPreference: "primary"
});
const keyv = new Keyv(connectionString, { store })

```

## License

MIT © Aditya Patadia
