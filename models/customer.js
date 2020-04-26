var mongoose = require("mongoose");
var transactions = require("./transactions");

var customerschema = new mongoose.Schema({
    account_no: {type: String, required: "Required"},
    ifsci: {type: String, default: "0000000000"},
    branch_code: {type: String, default: "AKS000000"},
    username: String, 
    password: String,
    balance: {type: Number, default: 0},
    transactions: [{
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "transactions"
                    }]
});

module.exports = mongoose.model("customers", customerschema);