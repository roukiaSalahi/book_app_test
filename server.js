"use strict"
// -------------------------------- DECLARE VARIABLES --------------------------------
require("dotenv").config(".env");
const express = require("express");
const cors = require("cors");
// const expressLayouts = require("express-ejs-layouts");
const pg = require("pg");
const methodOverride = require("method-override");
const client = new pg.Client(process.env.DATABASE_URL);

//Inintialize the server
const app = express();
//Declare a port
const PORT = process.env.PORT || 3000;
// Declare Key

// using layout
// app.use(expressLayouts);
//using cors
app.use(cors());

const superagent = require("superagent");


//view engine setup
app.set("view engine", "ejs");
// setup public folder
app.use(express.static("public"));
//set the encode for post body request
app.use(express.urlencoded({ extended: true }));
//override http method
app.use(methodOverride("_method"));
//set database and connect to server
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log("iam listneng to port: ", PORT);
    })
})

// // test route
// app.get("/", (req,res)=>{
//     res.send("hello World")
// });

// -------------------------------- Routes --------------------------------

app.get('/searches/new', (req, res) => {
    res.render("pages/searches/new");
})



// -------------------------------- API FUNCTIONS -------------------------

// https://www.googleapis.com/books/v1/volumes?q=search+terms
// terms : intitle or inauthor
// https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor
app.post('/searches', (req, res) => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.searchBook}+${req.body.searchByTitle ? 'intitle' : 'inauthor'}`;
    superagent.get(url).then(data => {
        let allBooksResults = [];
        data.body.items.map(e => {
            let newBook = new Book(e);
            allBooksResults.push(newBook);

        })
        res.render("pages/searches/show", { searchResults: allBooksResults });
    }).catch((error) => {
        console.log(error);
    })
});

// another solution : 
// let searchBook = req.body.searchBook;
// let searchByTitle = req.body.searchByTitle;
// let terms;
// if (searchByTitle){
//     terms = 'intitle';
// }
// else{
//     terms = 'inauthor';
// }
// let url = `https://www.googleapis.com/books/v1/volumes?q=${searchBook}+${terms}`;


// -------------------------------- Database Functions --------------------

// save books to database 
app.post('/books', (req, res) => {
    let bookData = req.body;
    let SQL = `INSERT INTO books (author,title,isbn,img,description,bookshelf) VALUES($1, $2, $3, $4, $5, $6) RETURNING id`;
    let values = [bookData.author, bookData.title, bookData.isbn, bookData.img, bookData.description, bookData.bookshelf];
    client.query(SQL, values).then(results => {
        // console.log('this is bookdata: ', bookData);
        // console.log('this is results: ', results);
        // console.log('this is results.rows: ', results.rows);
        // console.log('this is results.rows[0]: ', results.rows[0]);
        // console.log('this is results.rows[0].id: ', results.rows[0].id);
         // to render the detailed page 
        res.redirect(`/books/${results.rows[0].id}`);
    }).catch((error) => {
        console.log(error);
    })
})

//home route
app.get('/', (req, res) => {
    let SQL = `SELECT * FROM books;`;
    // or let SQL =  "SELECT * FROM BOOKS ORDER BY id DESC"; //TO render them by newests
    client.query(SQL).then(results => {
        // console.log("results :", results); 
        res.render("pages/index", { finalResult: results.rows });
        // console.log('home results: ', results)
    }).catch((error) => {
        console.log(error);
    })
})

// add book by id
//http://localhost:3100/books/4
app.get('/books/:id', (req, res) => {
    let SQL = `SELECT * FROM books WHERE id=$1;`;
    let values = [req.params.id];
    client.query(SQL, values).then(results => {
        // console.log('req: ',req)
        // console.log('req.params: ',req.params)
        // console.log('req.params.id: ',req.params.id)
        // console.log('results: ',results)
        // console.log('results.rows: ',results.rows)
        // console.log('results.rows[0]: ', results.rows[0]);
        res.render("pages/books/show", { detailBook: results.rows })
        //results.rows is an array conating one element so you should add foreach in the ejs file to loop over it 
        // or res.render("pages/books/show",{detailBook:results.rows[0]})
        //but here it will give you the element its self so you dont have to add foreach in the ejs file 
    }).catch((error) => {
        console.log(error);
    })
})

// update book data
app.put('/books/:id', (req, res) => {
    let updatedBookData = req.body;
    let SQL = `UPDATE books SET author = $1 ,title = $2 ,  isbn = $3 , img = $4 , description = $5 , bookshelf = $6 WHERE id = $7;`;
    let values = [updatedBookData.author, updatedBookData.title, updatedBookData.isbn, updatedBookData.img, updatedBookData.description, updatedBookData.bookshelf, req.params.id];
    client.query(SQL, values).then(results => {
        console.log(results);
        console.log(results.rows);
        res.redirect(`/books/${req.params.id}`);
    }).catch((error) => {
        console.log(error);
    })
})

// delete book from home
app.delete('/books/:id',(req, res)=>{
    let SQL = `DELETE FROM books WHERE id = $1;`;
    let values = [req.params.id];
    client.query(SQL,values).then(results=>{
        res.redirect('/');
    }).catch((error) => {
        console.log(error);
    })
})

// -------------------------------- constructors --------------------------
function Book(data) {
    this.img = data.volumeInfo.imageLinks.thumbnail || 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors;
    this.description = data.volumeInfo.description;
    this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;
    this.bookshelf = data.volumeInfo.categories;
}
