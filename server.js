var express = require('express'),

app = express(),

mongoose = require('mongoose'),

morgan = require('morgan'),

Note = require('./api/models/note'),

bodyParser = require('body-parser');

config = require('./configs/'+ (process.env.NODE_ENV || "dev") + ".json");

port = config.port || 3000;

mongoose.Promise = global.Promise;

mongoose.connect(config.DBHost, { useNewUrlParser: true });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("MongoDB Connected");
});

if(process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

let noteRoutes = require('./api/routes/note');
noteRoutes(app);

app.listen(port);

console.log('RESTful API server started on: ' + port + " using "+ process.env.NODE_ENV + " profile");

module.exports = app;