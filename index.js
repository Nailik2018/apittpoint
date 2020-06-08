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

// Datum
let currentDate = new Date();
let day = currentDate.getDate();
let month = currentDate.getMonth();
let year = currentDate.getFullYear();
let clearDate = returnCurrentMonthElos(day, month, year);

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

    let apiPath = './api.html';

    fs.readFile(apiPath, function (error, html) {
        if (error) {
            throw error;
        }
        res.end(html);
    });
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

app.get('/club=:clubname', function (req, res) {

    let clubname = req.params.clubname;

    let params = [clubname, clearDate, year];

    console.log(params);

    var sql = "SELECT * FROM club INNER JOIN player ON player.clubID = club.id INNER JOIN elos_archiv ON elos_archiv.licenceNr = player.licenceNr INNER JOIN months ON months.id = elos_archiv.monthID WHERE club.clubname = ? AND elos_archiv.monthID = ? AND elos_archiv.year = ? GROUP BY player.lastname ASC";
    //var sql = "SELECT * FROM club INNER JOIN player ON player.clubID = club.id INNER JOIN elos_archiv ON elos_archiv.licenceNr = player.licenceNr WHERE club.clubname = ? GROUP BY player.lastname ASC";

    connection.query(sql, params, function(err, results, fields) {

        // Mindestens ein Spieler muss in einem Club vorhanden sein
        if(results.length >= 1){
            res.send(results);
        }else{
            res.send("Ihr Club mit dem Namen " + clubname + " ist nicht vorhanden!")
        }
    });
});

//app.get('/ranking=:gender&month=:month', function (req, res) {
app.get('/ranking=:gender', function (req, res) {

    let gender = req.params.gender;
    //let month = req.params.month;

    //console.log(month);
    console.log(gender);

    var sql = "SELECT * FROM elos_archiv INNER JOIN player ON player.licenceNr = elos_archiv.licenceNr INNER JOIN gender ON gender.id = player.genderID INNER JOIN months ON months.id = elos_archiv.monthID WHERE gender.gender = ? ORDER BY elos_archiv.elo DESC";

    //var sql = "SELECT *, ranking FROM (SELECT COUNT(*) as ranking FROM elos_archiv INNER JOIN player ON player.licenceNr = elos_archiv.licenceNr INNER JOIN gender ON gender.id = player.genderID WHERE gender.gender = ? ORDER BY elos_archiv.elo DESC) T WHERE ranking > 0"
    //var sql = "SELECT * FROM (SELECT player.firstname, player.lastname, player.licenceNr, club.clubname, club.id, COUNT(*) as ranking FROM elos_archiv INNER JOIN player ON player.licenceNr = elos_archiv.licenceNr INNER JOIN gender ON gender.id = player.genderID WHERE gender.gender = ? ORDER BY elos_archiv.elo DESC) data WHERE data.ranking > 0"

    connection.query(sql, gender, function(err, results, fields) {

        // Mindestens ein Spieler muss in einem Club vorhanden sein
        if(results.length >= 1){

            let rangingStart = 1;

            for(let r in results){
                results[r]['ranking'] = rangingStart;
                rangingStart += 1;
            }
            res.send(results);
        }else{
            res.send("Ihr Club mit dem Namen " + gender + " ist nicht vorhanden!")
        }
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function returnCurrentMonthElos(day, month, year) {

    if(day < 10){
        month = month;
    }else{
        month = month - 1;
    }
    return month;
}