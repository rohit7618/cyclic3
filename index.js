// Import necessary modules and set up Express app
const express = require("express");
const app = express();
app.set('view engine', 'ejs'); // Set the view engine to EJS
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash'); // Import the lodash library

// Connect to MongoDB database
mongoose.connect("mongodb+srv://rhyadav112:Rohit1123@cluster0.q3bg4jf.mongodb.net/todolist", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose schema for items
const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);

// Create default items for insertion if the database is empty
const Item1 = new Item({
  name: "welcome to todolist"
});
const Item2 = new Item({
  name: "..........Hello.............."
});
const Item3 = new Item({
  name: ".....How are you..........."
});
const defaultItems = [Item1, Item2, Item3];

// Check if the database is empty, and insert default items if necessary
(async () => {
  try {
    const count = await Item.countDocuments({});
    if (count === 0) {
      const result = await Item.insertMany(defaultItems);
      console.log("Default items inserted:", result);
    }
  } catch (error) {
    console.error(error);
  }
})();

// Define Mongoose schema for custom lists
const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);

// Configure app settings and middleware
app.use(express.static("public")); // Serve static files from the "public" folder
app.use(bodyParser.urlencoded({
  extended: true
})); // Parse request bodies

// Handle GET request for the root route ("/")
app.get("/", async function(req, res) {
  try {
    const foundDocuments = await Item.find({});
    res.render('list', {
      listtitle: "Today",
      newtodos: foundDocuments
    });
  } catch (error) {
    console.error(error);
  }
});

// Handle GET request for custom list routes ("/:customListName")
app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName); // Capitalize the custom list name

  try {
    const listFound = await List.findOne({
      name: customListName
    });

    if (!listFound) {
      // If the list doesn't exist, create a new one with default items
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
      await newList.save(); // Save the new list to the database
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listtitle: listFound.name,
        newtodos: listFound.items
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Handle POST request when submitting a new item
app.post("/", async function(req, res) {
  const itemName = req.body.items;
  const listName = req.body.button;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    // If the list name is "Today", save the new item to the database
    item.save();
    console.log("Item saved:", itemName);
    res.redirect("/"); // Redirect back to the root route ("/")
  } else {
    try {
      // Find the custom list and update it with the new item
      const listFound = await List.findOne({
        name: listName
      });

      if (listFound) {
        listFound.items.push(item);
        await listFound.save();
        console.log("Item added to list:", listName);
        res.redirect("/" + listName);
      } else {
        console.log("List not found");
        res.redirect("/");
      }
    } catch (error) {
      console.error(error);
      res.redirect("/");
    }
  }
});

// Handle POST request for deleting an item
app.post("/delete", async function(req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.checkboxdelete;

  if (listName === "Today") {
    // If the list name is "Today", delete the item from the Items collection
    try {
      const removedItem = await Item.findByIdAndRemove(itemId);
      if (removedItem) {
        console.log("Successfully deleted item:", itemId);
        res.redirect("/");
      } else {
        res.status(404).send("Item not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred while deleting");
    }
  } else {
    // Delete the item from the custom list's items array using $pull
    try {
      const removedItem = await List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: itemId
          }
        }
      });

      if (removedItem) {
        console.log("Successfully deleted item from list:", listName);
        res.redirect("/" + listName);
      } else {
        res.status(404).send("Item not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred while deleting");
    }
  }
});

// Start the Express server on port 3000
app.listen(process.env.PORT || 3000, function() {
  console.log("Server is listening on port 3000");
});
