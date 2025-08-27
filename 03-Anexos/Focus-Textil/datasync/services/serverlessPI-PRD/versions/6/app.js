const express = require('express');
const app = express();
const { NodeJs } = require('./core/init')
const util = require('util');
const path = require('path');
const fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');

require("dotenv").config()


app.use(bodyParser.json({ limit: "500mb" }))
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true, parameterLimit: 500000 }))
app.use(bodyParser.raw({type: function(){return true;}, limit: '5mb'}));

app.use(cors())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next()
});

global.__basedir = __dirname;


const port = NodeJs.port;
//app listen
app.listen(port);
console.log("App Listen Port: " + port);

fs.readdirSync('./api').forEach(function (file) { require(util.format('%s/%s/%s', '.', 'api', file))(app); });
