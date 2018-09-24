import test from 'ava';
import Keyv from 'keyv';
import KeyvMongo from 'this';


test.serial('Stores value in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.set("filename", "value");
  let get = await store.get("filename");
  t.deepEqual(result.filename, "filename");
  t.deepEqual(get, "value");
});

test.serial('Gets value from GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.get("filename");
  t.deepEqual(result, "value");
});

test.serial('Stores value with TTL in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.set("filename", "value", 0);
  t.deepEqual(result.filename, "filename");
});

test.serial('Clears expired value from GridFS', async function(t) {
  const store = new KeyvMongo();
  let cleared = await store.clearExpired();
  t.deepEqual(cleared, true);
});

test.serial('Stores JSON in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.set("filename", {
    ok: true
  });
  t.deepEqual(result.filename, "filename");
});

test.serial('Gets JSON from GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.get("filename");
  t.deepEqual(result.ok, true);
});


test.serial('Stores Buffer in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.set("filename", Buffer.from("value"));
  t.deepEqual(result.filename, "filename");
});

test.serial('Gets Buffer from GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.get("filename");
  t.deepEqual(result.toString("utf-8"), "value");
});

test.serial('Stores Buffer in JSON in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.set("filename", {
    body: Buffer.from("value")
  });
  t.deepEqual(result.filename, "filename");
});

test.serial('Gets Buffer from JSON in GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.get("filename");
  t.deepEqual(result.body.toString("utf-8"), "value");
});

test.serial('Gets non-existent file and return should be undefined', async function(t) {
  const store = new KeyvMongo();
  let result = await store.get("non-existent-file");
  t.deepEqual(typeof result, "undefined");
});


test.serial('Non-string keys are not permitted in delete', async function(t) {
  const store = new KeyvMongo();
  let result = await store.delete({
    ok: true
  });
  t.deepEqual(result, false);
});

test.serial('Deletes value from GridFS', async function(t) {
  const store = new KeyvMongo();
  let result = await store.delete("filename");
  t.deepEqual(typeof result, "undefined");
});

test.serial('Clears entire cache store', async function(t) {
  const store = new KeyvMongo();
  let result = await store.clear();
  t.deepEqual(typeof result, "undefined");
});