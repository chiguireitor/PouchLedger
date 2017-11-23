'use strict'

const PouchDB = require('pouchdb')
const winston = require('winston')
const express = require('express')
const app = express()

const designDocs = require('./design_documents/')
const miner = require('./miner')

const CURRENT_DB_VERSION = 1

winston.level = process.env.LOG_LEVEL || 'debug'

var db = new PouchDB('ledger')
db.on('created', function(dbName) {
  winston.debug('db', `Opened database`)

  db.get('info')
    .then((doc) => {
      if (doc.version < CURRENT_DB_VERSION) {
        winston.debug('db', 'Database version old, upgrading')
        upgradeDb()
      } else {
        winston.debug('db', 'Database ready')
      }
    })
    .catch(() => {
      winston.debug('db', 'No info descriptor, init database')
      createDb()
    })

})

function createDb() {
  Promise.all([
    db.put({
      _id: 'info',
      version: CURRENT_DB_VERSION,
      epoch: 0
    })
      .then(() => {
        winston.debug('db', 'Descriptor created')
      })
      .catch(err => {
        winston.error('db', 'Error while creating information descriptor for db', err)
      }),

    db.put(designDocs.txs)
      .then(() => {
        winston.debug('db', 'Transaction list created')
      })
      .catch((err) => {
        winston.error('db', 'Error while creating txs design docs', err)
      })
  ]).catch((err) => {
    winston.error('db', 'Error while creating database', err)
  })
}

function upgradeDb() {
  // Do stuff
}

function fetchUtxos(list) {
  if (!list) {
    return null
  }

  return db.allDocs({
    include_docs: true,
    keys: list
  }).then((docs) => {
    return docs.rows.map((row, i) => {
      if (row.error) {
        throw new Error(`invalid utxo ${list[i]}`)
      } else if (row.doc.type !== 'tx') {
        throw new Error(`utxo is not a tx ${list[i]}`)
      } else {
        return row.doc
      }
    })
  })
}

const processors = {
  inout: (tx, acceptTx, rejectTx) => {
    fetchUtxos(tx.in)
      .then((txins) => {
        winston.debug('utxos', txins)
      })
      .catch(err => {
        rejectTx(err.message)
      })
  },
  genesis: (tx, acceptTx, rejectTx) => {
    acceptTx()
  }
}

function processTransaction(tx) {

  function rejectTx(err) {
    // reject
    winston.debug('utxos', 'Reject TX:', err, tx.id)
  }

  function acceptTx(err) {
    tx.confirmed = false
    db.put({_id: tx.id, doc: tx})
      .then(() => {
        winston.debug('utxos', 'Accept TX: ', tx.id)
      })
      .catch((err) => {
        winston.debug('utxos', 'Error while accepting TX: ', tx.id, err)
      })

  }

  if (tx.type === 'tx') {
    if (tx.subtype in processors) {
      processors[tx.subtype](tx, acceptTx, rejectTx)
    } else {
      rejectTx(`subtype not recognized ${tx.subtype}`)
    }
  } else {
    rejectTx('not a tx')
  }
}

processTransaction({
  type: 'tx',
  id: '1111',
  subtype: 'inout',
  in: [
    'deadbeef',
    'b00b5b00'
  ],
  out: [
    {
      type: 'send',
      address: '1234'
    }
  ]
})

processTransaction({
  type: 'tx',
  id: '1112',
  subtype: 'genesis',
  rules: {
    name: 'PouchCoin',
    ticker: 'POUCH',
    emission: 0,
    locked: false,
    divisible: 8,
    stakeable: true,
    subsidy: [
      {fromEpoch: 0, tokensPerTxConfirmed: 0.5},
      {fromEpoch: 10000, tokensPerTxConfirmed: 0.25},
      {fromEpoch: 20000, tokensPerTxConfirmed: 0.125},
      {fromEpoch: 30000, tokensPerTxConfirmed: 0.0625},
      {fromEpoch: 40000, tokensPerTxConfirmed: 0.03125},
      {fromEpoch: 50000, tokensPerTxConfirmed: 0.015625},
      {fromEpoch: 60000, tokensPerTxConfirmed: 0},
    ],
    initialDistribution: [

    ]
   }
})

miner.mine(db).catch(err => {
  winston.error('miner', err)
})

db.query('txs/unconfirmed')
  .then((docs) => {
    console.log(docs)
  })

app.listen(process.env.HTTP_PORT || 3000, () => console.log('PouchCash listening on port ' + (process.env.HTTP_PORT || 3000)))
