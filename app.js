const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose"); //library to connect mongoDB with mongoose

const app = express();

let thresholdValue = 0;
let thresholdValuePerDay = 0;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/partsDB",{useNewUrlParser: true})

const partSchema = {
    id:{type: Number,required: [true, "No ID❌"]},
    date: {type: Date, required: [true, "No ID❌"]},
    name: {type: String, required: [true, "No Name❌"]},
    size: {type: String, required: [true, "No Size"]},
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
    revenue: {type: Number},
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

    Part.find({stock: {$lt: thresholdValue}}, (err, data) => {
        if(err) {
            console.log(err);
            console.log("Error while generating order parts list❌");
        } else {
            res.render("orderItems", {orderParts: data});
        }
    })
})

app.get("/statistics", (req, res) => {

    SoldItem.find({}, (err, data) => {
        if(err) {
            console.log(err + "Error occured while calculating Stats❌");
        }
        else {
            let totalRevenue = 0;
            let totalProfit = 0;
            data.forEach( (event) => {
                totalRevenue += event.revenue;
                totalProfit += event.profit;
            });
            thresholdValue = totalRevenue / totalProfit;
            res.render("statistics", {totalRevenue: totalRevenue, totalProfit: totalProfit, Threshold: thresholdValue, Day: "OVERALL STATS"});
        }
    })
})

app.get("/sorting", (req, res) => {

    Part.find({}, (err, data) => {
        if(err) {
            console.log(err);
            console.log("Error while displaying purchased items from inventory ❌")
        } else{
            res.render("sorting", {printParts: data});
        }
    })

})

app.post("/", (req, res) => {

    const newPart = new Part({
        id: req.body.partId,
        date: new Date(),
        name: req.body.partName,
        size: req.body.size,
        supplier: req.body.supplierInfo,
        costPrice: req.body.price,
        stock: req.body.quantity,
        total: (req.body.price * req.body.quantity)
    });

    // Checking duplicates 
    Part.find({}, (err, data) => {
        if(err){
            console.log(err);
            console.log("Error while checking duplicates❌")
        } else {
            let set = 0;
            let nameExist = 0;
            let recordId = 0;
            data.forEach(event => {
                if(Number(event.id) === Number(req.body.partId)) {
                    set = 1;
                }
                if((event.name === req.body.partName) && (event.size === req.body.size)){
                    nameExist = 1;
                    recordId = event._id;
                }
            })
            if(set === 0) {
                if(nameExist === 1) {
                    //expecting cost price is same the stock is updated
                    Part.findByIdAndUpdate(recordId,{$inc: {stock: Number(req.body.quantity)}} ,(err, data) => {
                        if(err) {
                            console.log(err + " Error while updating stock for new registered part❌");
                        } else {
                            console.log("Regitered part already exists, so stock updated✅");
                            res.redirect("/inventory");
                        }
                    })

                } else {
                    newPart.save();
                    res.redirect("/inventory");
                    console.log("Part registered successfully✅");
                }
     
            } else {
                console.log("Given ID already exists❌  Enter a unique ID");
                res.redirect("/")
            }
        }
    })
    
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
                    revenue: (sellP * soldQuantity),
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


app.post("/sorting", (req, res) => {

    const inputDate = new Date(req.body.Date);
    const newOne = inputDate.toLocaleDateString();
    
    Part.find({}, (err, data) => {
        if(err) {
            console.log((err) + "An Error occued while filtering inventory❌");
        } else {
            const filterArray = [];

           data.forEach(event => {
            if(newOne === event.date.toLocaleDateString()) {
                filterArray.push(event);
            }
           }) 
            res.render("sorting", {printParts: filterArray});
        }
    })

})

app.post("/profit", (req, res) => {
    const inputDate = new Date(req.body.Date);
    const newOne = inputDate.toLocaleDateString();

    SoldItem.find({}, (err, data) => {
        if(err) {
            console.log(err + "Error occured while calculating Profit❌");
        }
        else {
            let todaysRevenue = 0;
            let todaysProfit = 0;
            data.forEach( (event) => {
                if(newOne === event.date.toLocaleDateString()) {
                    todaysRevenue += event.revenue;
                    todaysProfit += event.profit;
                } 
            });

            thresholdValuePerDay = todaysRevenue / todaysProfit;
            res.render("statistics", {totalRevenue: todaysRevenue, totalProfit: todaysProfit, Threshold: thresholdValuePerDay, Day: inputDate });
        }
    })
})

app.listen(3000, () => {
    console.log("Server stared on localhost:3000✅");
  });
