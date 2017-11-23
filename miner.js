'use strict'

const {
  HASH_ALGO,
  EPOCH_SALT,
  SCRATCHBUF_DIMENSION
} = require('./basic')

const crypto = require('crypto')

function squareArray(n) {
  let arr = new Array(n).fill(0).map(x => new Array(n).fill(0))

  arr.sqmap = (fn) => {
    arr.forEach(row => {
      row.map(fn)
    })
  }

  return arr
}

function getEpoch(db) {
  return db.get('info')
    .then((data) => {
      let hash = crypto.createHash(HASH_ALGO)
      let seed = hash.update(data.epoch + EPOCH_SALT).digest()

      let scratchBuf = squareArray(SCRATCHBUF_DIMENSION)
    })
}

function mine(db) {
  let grid = []

  return getEpoch(db)
}

module.exports = {
  mine
}
