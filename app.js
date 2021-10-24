const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose"); //library to connect mongoDB with mongoose

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/partsDB",{useNewUrlParser: true})

const partSchema = {
    id:{type: Number,required: [true, "No ID❌"]},
    date: {type: Date, required: [true, "No ID❌"]},
    name: {type: String, required: [true, "No Name❌"]},
    costPrice:{type: Number, required: [true, "No Price❌"]},
    supplier: {type: String, required: [true, "No Supplier Info❌"]},
    stock: {type: Number, required: [true, "No Stock Info❌"]},
    total: Number,
}

const itemSoldSchema = {
    id: {type: Number},
    date: {type: Date},
    name: {type: String},
    CP: {type: Number},
    SP: {type: Number},
    profit: {type: Number},
    quantity: {type: Number},
}

const Part = mongoose.model("Part", partSchema);
const SoldItem = mongoose.model("SoldItem",itemSoldSchema);


app.get("/", (req, res) => {
    res.render("home");
})

app.get("/inventory", (req, res) => {

    Part.find({}, (err, data) => {
        if(err) {
            console.log(err);
            console.log("Error while displaying purchased items from inventory ❌")
        } else{
            res.render("inventory", {printParts: data});
        }
    })
})

app.get("/soldItems", (req, res) => {

    SoldItem.find({}, (err, data) => {
        if(err) {
            console.log(err);
            console.log("Error while displaying sold items from inventory ❌")
        } else {
            res.render("soldItems", {soldParts: data});
        }
    })
})

app.get("/orderItems", (req, res) => {

    Part.find({stock: {$lt: 5}}, (err, data) => {
        if(err) {
            console.log(err);
            console.log("Error while generating order parts list❌");
        } else {
            res.render("orderItems", {orderParts: data});
        }
    })
})

app.post("/", (req, res) => {

    const newPart = new Part({
        id: req.body.partId,
        date: new Date(),
        name: req.body.partName,
        supplier: req.body.supplierInfo,
        costPrice: req.body.price,
        stock: req.body.quantity,
        total: (req.body.price * req.body.quantity)
    });

    newPart.save();
    res.redirect("/inventory");
    console.log("Part registered successfully✅");

    // Part.findById(req.body.partId, (err, data) => {
    //     if(err){
    //         console.log(err);
    //         console.log("Error while checking duplicates❌")
    //     }
    //     else if( data.id !== req.body.partId || data.id === null){
    //         newPart.save();
    //         res.redirect("/inventory");
    //         console.log("Part registered successfully✅");
    //     }else {
    //         res.redirect("/");
    //         console.log("Duplicate entry please try again❌")
    //     }
    // })
    
})

app.post("/update", (req, res) => {

    const id = req.body.updateData;
    const currentQuantity = Number(req.body.stock);
    const soldQuantity = Number(req.body.stockSold); 
    const sellP = Number(req.body.sellingPrice);
    const costP = Number(req.body.costPrice);
    // console.log(SP);
    // console.log(CP);
    // console.log(currentQuantity);
    // console.log(soldQuantity);

    if((soldQuantity > 0) && (soldQuantity <= currentQuantity)) {

        const madeProfit = (sellP-costP) * soldQuantity;
        console.log("Profit: " + madeProfit);

        Part.findByIdAndUpdate(id,{$inc: {stock: -soldQuantity}} ,(err, data) => {
            if(err) {
                console.log(err);
            }
            else{
                const newItemSold = new SoldItem({
                    id: data.id,
                    name: data.name,
                    date: new Date(),
                    CP: data.costPrice,
                    SP: sellP,
                    profit: madeProfit,
                    quantity: soldQuantity,
                });
                newItemSold.save();
                console.log("Item is sold and stock is updated✅");
                res.redirect("/soldItems");
            }
        })
    }else{
        console.log("❌   INVALID ENTRY (Please enter the data properly)");
        res.redirect("/inventory");
    }
})

app.listen(3000, () => {
    console.log("server stared on localhost: 3000✅");
  });
