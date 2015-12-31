const R = require('ramda');

const getDefault = R.curry((key, deflt, obj) => R.defaultTo(deflt)(obj[key]));
const get = R.curry((key, obj) => getDefault(key, null, obj));

const getPathDefault = R.curry((keys, deflt, obj) => {
  return keys.reduce((obj, key, i) => obj[key] || (i === keys.length - 1 ? deflt : {}), obj)
});
const getPath = R.curry((keys, obj) => getPathDefault(keys, null, obj));

const update = R.curry((key, f, obj) => R.assoc(key, f(get(key, obj)), obj));
const updatePath = R.curry((keys, f, obj) => R.assocPath(keys, f(getPath(keys, obj)), obj));
const removeAtIndex = R.curry((i, list) => {
  const split = R.splitAt(i, list);
  return R.concat(split[0], R.tail(split[1]));
});

const shuffle = R.curry((seed, list) => {
  const rand = require('random-seed').create(seed);

  const clone = R.clone(list);
  var n = clone.length, t, i;
  while (n) {
    i = rand.random() * n-- | 0; // 0 ≤ i < n
    t = clone[n];
    clone[n] = clone[i];
    clone[i] = t;
  }
  return clone;
});

module.exports = {
  getDefault: getDefault, get: get, getPathDefault: getPathDefault, getPath: getPath,
  shuffle: shuffle,
  update: update, updatePath: updatePath,
  removeAtIndex: removeAtIndex
};
