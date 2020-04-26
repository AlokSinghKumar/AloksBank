const mongoose = require("mongoose");

//bydefault the transection id is _id
var transactionschema = new mongoose.Schema({
    after_transection_balance: String,
    amount: Number,
    dateandtime: {type: Date, default: Date.now},
    type: Boolean      //False: debit | True: credit
});

module.exports = mongoose.model("transactions", transactionschema);