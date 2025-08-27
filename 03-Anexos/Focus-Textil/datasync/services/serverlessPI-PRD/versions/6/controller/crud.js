var couchbase = require("../core/couchbase.js");



function upsert(key, body, callback) {
    couchbase.openBucket();
    console.log("couchbase upsert");
    console.log("key: ",key);
    console.log("body: ",body);

    couchbase.bucket.upsert(key, body, function (err, results) {
        if (err) callback({ Results: [] });
        else callback({ Results: results });
    });
}

function get(key, callback) {
    couchbase.openBucket();
    console.log("couchbase get");
    console.log("key: ",key);

    couchbase.bucket.get(key, function (err, results) {
        if (err) callback({ Results: [] });
        else callback({ Results: results.value });
    });
}

function remove(key, callback) {
    couchbase.openBucket();
    console.log("couchbase remove");
    console.log("key: ",key);

    couchbase.bucket.remove(key, function (err, results) {
        if (err) callback({ Results: false });
        else callback({ Results: results });
    });
}


module.exports = {
    upsert,
    get,
    remove
};
