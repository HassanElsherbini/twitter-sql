var { Client } = require('pg');

var client = new Client('postgres://postgres:password@localhost/twitter-sql');

// connecting to the `postgres` server
client.connect();

// make the client available as a Node module
module.exports = client;
