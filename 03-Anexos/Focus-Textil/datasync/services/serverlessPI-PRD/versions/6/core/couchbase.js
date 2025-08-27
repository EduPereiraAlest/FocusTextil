var couchbase = require('couchbase');
var init = require('./init.js');

var cluster = new couchbase.Cluster(init.NodeJs.couchbase.Server);
cluster.authenticate(
  init.NodeJs.couchbase.User,
  init.NodeJs.couchbase.Password
);
var bucket = cluster.openBucket(init.NodeJs.couchbase.BucketSales);
var bucketLog = cluster.openBucket(init.NodeJs.couchbase.BucketLog);

bucketLog.operationTimeout = 30000;
bucket.operationTimeout = 30000;

function openBucket() {
  let tmp;

  if (!bucket.connected) {
    tmp = cluster.openBucket(init.NodeJs.couchbase.BucketSales);
    tmp.operationTimeout = 30000;

    exports.bucket = tmp;
  }

  if (!bucketLog.connected) {
    tmp = cluster.openBucket(init.NodeJs.couchbase.BucketLog);
    tmp.operationTimeout = 30000;

    exports.bucketLog = tmp;
  }
}

module.exports = {
  bucket,
  couchbase,
  bucketLog,
  openBucket
};
