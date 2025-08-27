exports.NodeJs = {
	couchbase: {
		User: process.env.COUCHBASE_USER,
		Password: process.env.COUCHBASE_PASSWORD,
		Server: process.env.COUCHBASE_SERVER,
		BucketSales: process.env.COUCHBASE_BUCKETSALES,
		BucketCep: process.env.COUCHBASE_BUCKET_CEP,
		BucketLog: process.env.COUCHBASE_BUCKET_LOG
	},
	port: process.env.PORT
};