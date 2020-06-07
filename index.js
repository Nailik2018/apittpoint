var express = require('express');
var app = express();
const mysql = require('mysql2');

var fs = require('fs');
var ini = require('ini');

// Datenbank Verbindungsdatei
var databaseConfig = ini.parse(fs.readFileSync('./database.ini', 'utf-8'));

// Datenbank verbindungsdaten aus der databaseini Datei
let host = databaseConfig.Database.host;
let user = databaseConfig.Database.user;
let pw = databaseConfig.Database.pw;
let dbname = databaseConfig.Database.dbname;

// create the connection to database
const connection = mysql.createConnection({
    host: host,
    user: user,
    database: dbname,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', function (req, res) {
    res.send('<h1>API</h1>');
});

// Ausgabe Verbände
app.get('/verbaende', function (req, res) {

// execute will internally call prepare and query
    connection.query(
        'SELECT * FROM association',
        function(err, results, fields) {
            res.send(results);
            //console.log(results); // results contains rows returned by server
        }
    )
});

// Json anzeige der Clubs im Verband
app.get('/verband=:association', function(req, res) {

    let verband = req.params.association;
    var sql = "SELECT club.id, club.clubname, club.associationID, association.association FROM club INNER JOIN association ON association.id = club.associationID WHERE association.association = ? ORDER BY club.clubname ASC";

    connection.query(sql, verband, function(err, results, fields) {

        // Mindestens ein Club muss in einem verband vorhanden sein
        if(results.length >= 1){
            res.send(results);
        }else{
            res.send("Ihr Veband mit dem Namen " + verband + " ist nicht vorhanden!")
        }
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});