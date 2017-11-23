'use strict'

const {
  HASH_ALGO
} = require('./basic')

const crypto = require('crypto')

function qhash(buf) {
  return crypto.createHash(HASH_ALGO).update(buf).digest()
}

function mapply(n, buf) {
  while (n > 0) {
    buf = qhash(buf)
    n--
  }

  return buf
}

function hdrand(seed, path) {
  let idxs = path.split('/').map(x => parseInt(x))

}

module.exports = {

}
