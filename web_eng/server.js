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

app.get('/content', async (req, res) => {
    
    const sqlQuery = "SELECT * FROM contentTable"
    await connection.query(sqlQuery, async (err, result) => {
        if (err) throw (err)
        console.log("------> Search Results")
        console.log(result)
        
        res.render('content', { username: "Diana", content: result });
    })

})

app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log("---------> Logout successful")
    //res.render('login', { error: "" })
    //res.render('login');
    res.redirect('login')
})

//post routes
//register
app.post("/register", async (req, res) => {
    const user = req.body.username;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    if (req.body.password === req.body.passwordRepeat) {
        connection.getConnection(async (err, connection) => {
            if (err) throw (err)

            const sqlSearch = "SELECT * FROM userTable WHERE user = ?"
            const search_query = mysql.format(sqlSearch, [user])    //username in db?
            const sqlInsert = "INSERT INTO userTable VALUES (0,?,?)"
            const insert_query = mysql.format(sqlInsert, [user, hashedPassword])    //right password?

            await connection.query(search_query, async (err, result) => {
                if (err) throw (err)
                console.log("------> Search Results")
                console.log(result.length)
                if (result.length != 0) {   //user already exists
                    connection.release()
                    console.log("------> User already exists")
                    res.render('register', { error: "User already exists" })
                } else {
                    await connection.query(insert_query, (err, result) => {
                        connection.release()
                        if (err) throw (err)
                        console.log("--------> Created new User")   //console.log(result.insertId)
                        //let token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
                        //res.status(200).json({ message: 'Login successful' , token: token});
                        //res.render('content', { username: user })
                        res.redirect('content')
                    })
                }
            })
        })
    } else {
        console.log("The passwords do not match")
        res.render('register', { error: "The passwords do not match" })
    }
})

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    //const username = req.body.username;
    //const user = { name: username };
    //const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10000' });
    //res.json({ accessToken: accessToken });

    // Check if the username exists in the database
    connection.query(
        'SELECT * FROM userTable WHERE user = ?',
        [username],
        (error, results) => {
            if (error) {
                console.error('Error querying the database:', error);
                res.status(500).json({ error: 'An error occurred during login' });
            } else if (results.length === 0) {
                console.log('User does not exist');
                res.status(401).json({ error: 'Invalid username or password' });
            } else {
                // User exists, compare the password
                const user = results[0];

                bcrypt.compare(password, user.password, (error, passwordMatch) => {
                    if (error) {
                        console.error('Error comparing passwords:', error);
                        res.status(500).json({ error: 'An error occurred during login' });
                    } else if (passwordMatch) {
                        // Password matches, authentication successful
                        // Generate a JWT token with the username and set it to expire in 1 hour
                        const token = jwt.sign({username}, secretKey, { expiresIn: '1h' });

                    /*                         token = jwt.sign(
                                                { userId: existingUser.id, email: existingUser.email },
                                                "secretkeyappearshere",
                                                { expiresIn: "1h" }
                                              ); */

                    //console.log("token: ", token)
                    // Return the token as the response
                    //console.log('Login successful');
                    res.status(200).json({ message: 'Login successful', token: token });
                } else {
                    // Password does not match
                    console.log('Invalid password');
                    res.status(401).json({ error: 'Invalid username or password'});
                }
                });
}
        }
);
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