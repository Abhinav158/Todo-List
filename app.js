//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Create a new database inside mongoDB 
//mongoose.connect("mongodb+srv://admin-abhinav:test123@cluster0.xwzxxet.mongodb.net/?retryWrites=true&w=majority/todolistDB", {useNewUrlParser: true});

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

//Create a schema for items in the list 
const itemsSchema = {
  name: String
};

//Create a Mongoose model based on the above schema
const Item = mongoose.model("Item", itemsSchema);

//Create some pre-made items to add in the Todo list 
const item1 = new Item({
  name: "Welcome to your To Do List!"
});

const item2 = new Item({
  name: "Hit + to add your task into the list"
});

const item3 = new Item({
  name: "Check the box once you're finished!"
});

const defaultItems = [item1, item2, item3];

const ListSchema = {
  name: String, 
  items: [itemsSchema] 
};
//Create the corresponding model 
const List = mongoose.model("List", ListSchema);


// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){  
    
  //If it is an empty list, add our default items 
    if(foundItems.length === 0){
      // //Use insertMany function to insert multiple items into the database
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully added default items!");
        }
      });
      res.redirect("/");
    }
    else
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });
  

});

//Use Express Route Parameters to generate lists of different categories 
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      //if no error, then check if list already exists
      if(!foundList){
        //Create a new list if list is not found
        const list = new List({
          name: customListName, 
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        //Return the originally existing list 
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

      }
    }
  });
  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});