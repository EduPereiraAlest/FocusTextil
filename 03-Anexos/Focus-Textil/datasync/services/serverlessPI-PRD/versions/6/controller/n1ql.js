var couchbase = require("../core/couchbase.js");



function find(search, callback) {
    var select = search;

    couchbase.openBucket();
    var N1qlQuery = couchbase.couchbase.N1qlQuery;
    query = N1qlQuery.fromString(select);
    console.log(query);
    couchbase.bucket.query(query, function (err, rows, meta) {
      if (err) callback({ Results: [] });
      else callback({ Results: rows });
    });
  }


  module.exports = {
    find
  };
