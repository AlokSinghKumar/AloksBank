const express = require("express");
const bodyparser = require("body-parser");
const transactions = require("./models/transactions");
const customer = require("./models/customer");
const mongoose = require("mongoose");
var JSAlert = require("js-alert");
const { findByIdAndUpdate } = require("./models/transactions");
var lock = false;

const app = express();
mongoose.connect("mongodb://localhost:27017/aloksBank", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useUnifiedTopology', true);
app.use(bodyparser.urlencoded({extended:  true}));

//The home page
app.get("/", (req, res) => {
    res.render("home.ejs");
});

//LOGIN GET ROUTE
app.get("/login", (req, res) => {
    res.render("login.ejs");
});

//LOGIN POST ROUTE
app.post("/login", (req, res) => {
    customer.findOne({username: req.body.customer.username}, (err, founduser) => {
        if(err){
            console.log(err);
        } else {
            if(founduser == null){
                console.log("invalid username or password");
                res.render("login.ejs");
            }
            else{
                res.redirect("/home/" + founduser._id);
            }
        }
    });
});

//SIGNUP GET ROUTE
app.get("/signup", (req, res)=>{
    res.render("signup.ejs");
});

//SIGNUP POST ROUTE
app.post("/signup", (req, res)=>{
    //creating new user
    customer.create({
        account_no: req.body.customer.account_no,
        username: req.body.customer.username,
        password: req.body.customer.password,
        branch_code: req.body.customer.branch_code,
        ifsci: req.body.customer.ifsci,
        balance: 10000
    }), (err, newcustomer)=>{
        if(err)
            console.log(err);
        else
            console.log(newcustomer);
    }
    res.redirect("/login");
});

//PROFILE
app.get("/home/:id", (req, res)=>{
    res.render("index.ejs", {id: req.params.id});
});

//MONEY TRANSFER
app.get("/home/transfer/:id", (req, res)=>{
    res.render("transfer.ejs", {customer: req.params.id});
});

app.post("/home/transfer/:id", (req, res)=>{
    var sender = req.params.id;
    var receiver = req.body.transfer.account_no;
    var receiversbalance;
    var sendersbalance;

    customer.findOne({account_no: receiver}, async (err, receiver) => {
        if(err)
            console.log(err);
        else{
            //stert stransection
            //const session = await customer.startSession();

            receiversbalance = Number(receiver.balance) + Number(req.body.transfer.amount);
            //finding sender amount
            customer.findById(sender, async (err, sender) => {
                if(err)
                    console.log(err);
                else{
                    
                    sendersbalance = Number(sender.balance) - Number(req.body.transfer.amount);
                    
                    // commit the changes if everything was successful
                    //session.commitTransaction();

                    customer.findByIdAndUpdate(sender, {balance: Number(sendersbalance)}, async (err, send) => {
                        if(err)
                            console.log(err);
                        else{
                            customer.findByIdAndUpdate(receiver._id, {balance: Number(receiversbalance)}, async (err, received) => {
                                if(err){
                                    // this will rollback any changes made in the database
                                    //await session.abortTransaction();
                                    console.log(err);
                                }
                                else{
                                    transactions.create({
                                        after_transection_balance: sendersbalance,
                                        amount: Number(req.body.transfer.amount),
                                        type: false     
                                    }, async (err, addtransaction) => {
                                        if(err){
                                            // this will rollback any changes made in the database
                                           // await session.abortTransaction();
                                            console.log(err);
                                        }
                                        else{
                                             sender.transactions.push(addtransaction); 
                                             sender.save( async (err, savedtransaction) => {
                                                if(err)
                                                    console.log(err);
                                             }); 
                                        }
                                    });

                                    transactions.create({
                                        after_transection_balance: sendersbalance,
                                        amount: Number(req.body.transfer.amount),
                                        type: true 
                                    }, async (err, addtransaction) => {
                                        if(err){
                                            // this will rollback any changes made in the database
                                            await session.abortTransaction();
                                            console.log(err);
                                        }
                                        else{
                                            receiver.transactions.push(addtransaction);
                                            receiver.save((err, savetransaction) => {
                                                if(err)
                                                    console.log(err);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });        
                }
            });           
        }
        //await session.endTransaction();
    });
    res.redirect("/home/transfer/" + req.params.id);
});

//BALANCE ENQUERY
app.get("/home/balanceenquery/:id", (req, res) => {
    customer.findOne({_id: req.params.id}, (err, found) => {
        if(err)
            console.log(err);
        else{
            res.render("balance.ejs", {customer: found});
        }
    });
});

// //MINI STATEMENT
app.get("/home/:id/ministatement", (req, res) => {
    // console.log(req.params.id);
    customer.findById(req.params.id).populate("transactions").exec((err, transaction) => {
        if(err)
            console.log(err);
        else{
            res.render("ministatement.ejs", {transaction: transaction});
        }      
    });
});

app.listen(8000, (req, res) => {
    console.log("server started");
});