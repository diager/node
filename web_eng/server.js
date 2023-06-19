require("dotenv").config() //loads environmental variables from the .env file

const express = require("express") //web framework for node.js
const app = express()
const mysql = require("mysql")
//const mysql = require('mysql2/promise');
const bodyParser = require('body-parser'); // middleware for parsing incoming request bodies 
const bcrypt = require("bcrypt") //hash passwords
const ejs = require('ejs'); //templating language
app.set('view engine', 'ejs');
const cookieParser = require("cookie-parser"); //middleware which parses cookies attached to the client request object
const sessions = require('express-session'); //session middleware
const jwt = require('jsonwebtoken');

//const secretKey = process.env.JWT_SECRET
const secretKey = 'your_secret_key'

//middleware function for req
app.use(bodyParser.urlencoded({ extended: true })); //for form data of http requests
app.use(express.json()); //parses incoming request bodies in JSON format 
app.use(express.static('views')); //specified directory for HTML, CSS, JS
app.use(cookieParser()); //cookies in req.cookies object

//db connection
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const connection = mysql.createPool({
    connectionLimit: 100,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT
})


function authenticateToken(req, res, next) {
    console.log("test: ", req.query.token)
    const token = req.query.token

    //const authHeader = req.headers['authorization'];
    //const token = authHeader && authHeader.split(' ')[1]; //If there is an authHeader then && ... else undefined
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); //Token not valid
        req.user = user;
        next();
    });
}

connection.getConnection((err, connection) => {
    if (err) throw (err)
    console.log("DB connected successful: " + connection.threadId)
    connection.query('CREATE DATABASE IF NOT EXISTS userDB');
    connection.query('USE userDB');

    connection.query(`CREATE TABLE IF NOT EXISTS userTable (
          userId INT NOT NULL AUTO_INCREMENT,
          user VARCHAR(45) NOT NULL,
          password VARCHAR(100) NOT NULL,
          PRIMARY KEY (userId)
        )`);

    // Release the connection back to the connection pool
    connection.release();
    console.log('Database and table created successfully!');
    if (err) {
        console.error('Error creating database and table:', err);
    }
})


//use session 
const oneDay = 1000 * 60 * 60 * 24;
//session middleware
app.use(sessions({
    secret: "secret",
    resave: false,  //if store implements touch mode -> false
    saveUninitialized: false,    //no uninitialzed sessions are saved to the store -> login session
    cookie: { maxAge: oneDay, secure: false }
}));
var session;

//get routes
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register', { error: "" });
});

app.get('/content', authenticateToken, async (req, res) => {
    const token = req.query.token
    if (token){
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log("decoded:", decoded.name);
            const user = decoded.name;
            const sqlQuery = "SELECT * FROM contentTable"

            await connection.query(sqlQuery, async (err, result) => {
                if (err) throw (err)
                console.log("------> Search Results")
                console.log(result)

                //res.render('content', { username: "Diana", content: result });
                res.render('content', { user, content: result });
            })
            } catch (error) {
                res.status(401).send('Invalid token');
            }
        } else {
        res.status(400).send('Token not found');
    }
});




app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log("---------> Logout successful")
    //res.render('login', { error: "" })
    //res.render('login');
    res.redirect('login')
})


app.post('/login', function (req, res) {
    const { username, password } = req.body;

    // Check if the user exists
    connection.query('SELECT * FROM userTable WHERE user = ?', [username], function (error, results) {
        if (error) {
            console.error('Error executing database query: ' + error.stack);
            res.json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
            return;
        }

        if (results.length === 0) {
            res.json({ success: false, message: 'Benutzername existiert nicht.' });
            return;
        }

        const user = results[0];

        // Compare the password with the hashed password
        bcrypt.compare(password, user.password, function (err, passwordMatch) {
            if (err) {
                console.error('Error comparing passwords: ' + err.stack);
                res.json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
                return;
            }

            if (passwordMatch) {
                const username = req.body.username;
                const user = { name: username };
                const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1000000' });
                //res.json({ success: true }, { accessToken: accessToken });
                console.log("Access Token " + accessToken)
                res.status(200).json({ success: true, accessToken: accessToken });

                //res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Falsches Passwort.' });
            }
        });
    });
});



app.post('/register', function (req, res) {
    const { username, password } = req.body;

    // Check if the user already exists
    connection.query('SELECT * FROM userTable WHERE user = ?', [username], function (error, results) {
        if (error) {
            console.error('Error executing database query: ' + error.stack);
            res.json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
            return;
        }

        if (results.length > 0) {
            res.json({ success: false, message: 'Benutzername existiert bereits.' });
            return;
        }

        // Hash the password
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.error('Error hashing password: ' + err.stack);
                res.json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
                return;
            }

            // Store the user in the database
            connection.query('INSERT INTO userTable (user, password) VALUES (?, ?)', [username, hash], function (err, results) {
                if (err) {
                    console.error('Error executing database query: ' + err.stack);
                    res.json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
                    return;
                }

                //res.json({ success: true });
                res.status(200).json({ success: true, accessToken: accessToken });
            });
        });
    });
});


app.post("/createTheme", (req, res) => {
    const sql = "INSERT INTO contentTable (kuerzel, thema, text) VALUES (?, ?, ?)";
    const values = [req.body.kuerzel, req.body.thema, req.body.text];

    connection.query(sql, values, (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send("Error creating theme");
        } else {
            console.log("RESULTS:", results)
            console.log("fields:", fields)

            const sqlQuery = "SELECT * FROM contentTable"
            connection.query(sqlQuery, async (err, result) => {
                if (err) throw (err)
                console.log("------> Search Results")
                console.log(result)
                res.render('content', { username: "Diana", content: result });
            })
        }
    });
    res.redirect('/content');
});

app.get('/text', function (req, res) {
    var id = req.query.id;
    //console.log("ID: ", id)

    connection.query('SELECT text FROM contentTable WHERE themaID = ?', id, function (err, results) {
        if (err) throw err;
        const text = results[0].text
        //console.log("text: ", text)
        //console.log("Results: ", results)
        res.json({ text: text })


    })
})


app.post('/updateTable/:id', (req, res) => {

    console.log(req.body)
    const id = req.body.id;
    const kuerzel = req.body.kuerzel;
    const thema = req.body.thema;
    const text = req.body.text;
    // code to update the data in your database using the received parameters
    console.log("IDDDD: " + id, kuerzel, thema, text)

    res.send('Data updated successfully'); // sending a response back to the client
    //res.redirect('/content');
});


app.get('/contentTableUpdate/:id', (req, res) => {
    var id = req.params.id;
    console.log("id: " + id)

    connection.query('SELECT * FROM contentTable WHERE themaID = ?', [id], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Error retrieving data from the database');
        } else {
            //console.log("NEW RESULTS: " + results[0].kuerzel)
            console.log("RESULTSsssssss")
            console.log(results[0])
            console.log(results[0].themaID)

            const id = results[0].themaID;
            const kuerzel = results[0].kuerzel;
            const thema = results[0].thema;
            const text = results[0].kuerzel;
            res.json({ id: id, kuerzel: kuerzel, thema: thema, text: text });
        }
    })
});


app.delete('/contentTable/:id', (req, res) => {
    var id = req.params.id;
    console.log("id: " + id)
    connection.query('DELETE FROM contentTable WHERE themaID = ?', [id], function (err, result) {
        if (err) throw err;

        console.log("Result: " + result)
        res.send('OK');
    });
});

app.get('/getUpdateRow/:id', (req, res) => {
    const id = req.params.id;
    // Process the request and return the response
    connection.query('SELECT * FROM contentTable WHERE themaID = ?', id, function (err, results) {
        if (err) throw err;
        const result = results[0]
        //console.log("text: ", text)
        //console.log("Results: ", results)
        console.log("The results: ", result)
        res.json({ result: result })

    })

    console.log("The Id of the row is: ", id)
});


app.post('/updateRow/:id', (req, res) => {
    const id = req.params.id;
    const kuerzel = req.body.kuerzel;
    const thema = req.body.thema;
    const text = req.body.text;

    console.log("The row id is: " + id);
    console.log("neues Kürzel: " + kuerzel);

    const sql = `UPDATE contentTable SET kuerzel = ?, thema = ?, text = ? WHERE themaID = ?`;
    connection.query(sql, [kuerzel, thema, text, id], (err, result) => {
        if (err) throw err;
        console.log('Row updated successfully');

    });
})


//start server
const port = process.env.PORT
app.listen(port, () => console.log(`Server Started on port ${port}...`))