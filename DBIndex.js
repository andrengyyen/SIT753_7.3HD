// Require the express web application framework (https://expressjs.com)
let express = require('express')

// Create a new web application by calling the express function
let app = express()

let sqlite3 = require('sqlite3').verbose();

// persistent file database "myDB".
let db = new sqlite3.Database('myDB');

db.serialize(function() {
    
    db.run("CREATE TABLE IF NOT EXISTS Message (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, subject TEXT, message TEXT)");
    db.run("DELETE FROM Message");
    db.run("CREATE TABLE IF NOT EXISTS OrderTable (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, items TEXT, total TEXT)");
    db.run("DELETE FROM OrderTable");
    db.run("CREATE TABLE IF NOT EXISTS User (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)");
    db.run("DELETE FROM User");
    

});



db.close();
