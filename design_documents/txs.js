'use strict'

module.exports = {
  _id: '_design/txs',
  views: {

    txs: function(doc) {
      if (doc.type === 'tx') {
        emit(doc)
      }
    }.toString(),

    unconfirmed: function(doc) {
      if ((doc.type === 'tx') && (!doc.confirmed)) {
        emit(doc)
      }
    }.toString(),

    utxos: function(doc) {
      if ((doc.type === 'tx') && (!doc.spent)) {
        emit(doc)
      }
    }.toString(),

    issuances: function(doc) {
      if ((doc.type === 'tx') && (!doc.subtype === 'issuance')) {
        emit(doc)
      }
    }.toString(),

    orders: function(doc) {
      if ((doc.type === 'tx') && (!doc.subtype === 'order')) {
        emit(doc)
      }
    }.toString(),

    broadcasts: function(doc) {
      if ((doc.type === 'tx') && (!doc.subtype === 'broadcast')) {
        emit(doc)
      }
    }.toString(),

  }
}
