/**
 * Name: Ryan Le, Robin Luo
 * Date: December 10th, 2021
 * Section: CSE 154 AE and AB
 *
 * This is the app.js for the index.js, which is used for client to interact with the bakery
 * database and provides functionally to transactions, accounts, through providing verification and
 * parsed data.
 */

"use strict";

const express = require("express");
const {Client} = require("pg");
const app = express();
const multer = require("multer");

app.use(express.urlencoded({extended: true}));
app.use(multer().none());
app.use(express.json());

const SERVER_ERROR_CODE = "A server error has occurred!";

/**
 * Upon request, the function gives the item information of either the entire item table in the
 * database, which is all the Bear Bakerie products or a certain item if given an name.
 */
app.get('/menu', async function(req, res) {
  try {
    let item = req.query.item;
    let db = await getDBConnection();
    let qrt;
    let result;

    if (!item) {
      qrt = "SELECT * FROM item;";
      result = await db.query(qrt);
    } else {
      qrt = "SELECT * FROM item WHERE name = ?;";
      result = await db.query(qrt, item);
    }

    db.end();
    res.json(result.rows);
  } catch (error) {
    res.type("text");
    res.status(500).send(SERVER_ERROR_CODE);
  }
});

/**
 * Given the account details, username and password, the function checks the account table to see if
 * those key values match together to an account then returns the username and account balance.
 */
app.post('/account', async function(req, res) {
  try {
    let db = await getDBConnection();
    let username = req.body.username;
    let password = req.body.password;
    let qrt = "SELECT name, money FROM account WHERE (name = $1 AND password = $2);";
    let result = await db.query(qrt, [username, password]);
    if (result.rows.length === 0) {
      db.end();
      res.type("text");
      res.status(400).send("Invalid Username and/or Password.");
    } else {
      db.end();
      res.json(result.rows[0]);
    }

  } catch (error) {
    res.type("text");
    res.status(500).send(SERVER_ERROR_CODE);
  }
});

/**
 * This function given an search term, value, or rating, three types of different information in the
 * database, the filter function will find all the items that matches the given search conditions
 * and returns all the matched items.
 */
 app.post('/filter', async function(req, res) {
  try {
    let db = await getDBConnection();
    let search = req.body.search;
    let item = "%" + search + "%";
    let type = req.body.type;
    let rating = req.body.rating;
    let result;

    if (search || type || rating) {
      result = await filter(search, item, type, rating);
      db.end();
      res.json(result);
    } else {
      db.end();
      res.type("text");
      res.status(400).send("All parameters are missing!");
    }

  } catch (error) {
    res.type("text");
    res.status(500).send(SERVER_ERROR_CODE);
  }
});

/**
 * This function verifies the username and the account information then verifies if the user is able
 * to purchase the item and its amount, checks if the item is apart of another transaction by
 * the purchase ID. If all conditions are met, the user's item will be processed.
 */
app.post('/purchase', async function(req, res) {
  try {
    let purchaseID = await checkPurchaseID(parseInt(req.body.pid));
    let accountData = await getAccountData(req.body.username);
    let itemData = await getItemData(req.body.item);

    if (accountData && itemData && req.body.amount) {
      if (itemData[0].stock >= req.body.amount || itemData[0].stock === -1) {
        if (accountData[0].money >= (itemData[0].price * req.body.amount)) {
          res.json(await transaction(accountData[0], itemData[0], req.body.amount, purchaseID));
        } else {
          res.type("text");
          res.status(400).send("Total cost is greater than the account money!");
        }
      } else {
        res.type("text");
        res.status(400).send("Item amount is greater than the item stock!");
      }
    } else {
      res.type("text");
      res.status(400).send("Invalid User or Item or Amount!");
    }
  } catch (error) {
    res.type("text");
    res.status(500).send(SERVER_ERROR_CODE);
  }
});

/**
 * This function grabs the purchase history of the user and returns it to the client.
 */
app.post('/account/history', async function(req, res) {
  try {
    let db = await getDBConnection();
    let username = req.body.username;
    let userData = await getAccountData(username);
    let accountId = userData[0].account_id;
    if (userData[0]) {
      let qry = "SELECT i.name, i.item_id, p.item_cost, p.amount, p.purchase_id, p.account_id " +
                "FROM purchase p, item i WHERE (p.item_id = i.item_id) AND (p.account_id = $1);";
      let result = await db.query(qry, [accountId]);
      db.end();
      res.json(result["rows"]);
    } else {
      res.type("text");
      res.status(400).send("Invalid username!");
    }
  } catch (error) {
    res.type("text");
    res.status(500).send(SERVER_ERROR_CODE);
  }
});

/**
 * This function creates a new user for the database based on the information provided and meets the
 * requirements of a new account such as unique name and email.
 */
app.post('/account/new', async function(req, res) {
  let db = await getDBConnection();
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  let accountData = await getAccountData(username);
  let checkEmailQry = "SELECT email FROM account WHERE email = $1;";
  let checkEmail = await db.query(checkEmailQry, [email]);

  if (!accountData[0] && password && !checkEmail["rows"][0]) {
    let lastID = await db.query("SELECT MAX(account_id) FROM account");
    let newID = lastID["rows"][0]["max"] + 1;
    let qry = "INSERT INTO account (account_id, name, password, email, money) VALUES ($1, $2, $3, $4, $5);";
    await db.query(qry, [newID, username, password, email, 0]);
    res.type("text");
    res.send("Successfully created");
  } else {
    res.type("text");
    res.status(400).send("Invalid Parameters! Username, password, or email");
  }
});

/**
 * This function updates the User's total balance when given an amount and name.
 */
app.post('/account/money', async function(req, res) {
  let db = await getDBConnection();
  let username = req.body.username;
  let money = parseFloat(req.body.money);
  let account = await getAccountData(username);
  let accountBalance = account[0].money;
  let newBalance = accountBalance + money;

  if (account && !isNaN(money)) {
    let qry = "UPDATE account SET money = $1 WHERE account_id = $2;";
    await db.query(qry, [newBalance, account[0].account_id]);
    qry = "SELECT money FROM account WHERE account_id = $1;";
    let result = await db.query(qry, [account[0].account_id]);

    db.end();
    res.type("text");
    res.send(String(result["rows"][0]["money"]));
  } else {
    db.end();
    res.type("text");
    res.status(400).send("Invalid Account or money parameter!");
  }
});

/**
 * Given a username, the function checks if the username is connected to an account to the database
 * and sends the information back to the server to be used.
 * @param {String} username - An account username
 * @returns {Object} accountData - The database's account data about the given user.
 */
async function getAccountData(username) {
  let db = await getDBConnection();
  let accountQry = "SELECT account_id, name, money FROM account WHERE name = $1;";
  let accountData = await db.query(accountQry, [username]);
  db.end();
  return accountData.rows;
}

/**
 * Given a item name, the function checks if the item name is connected to an account to the
 * database and sends the information back to the server to be used.
 * @param {String} item - an Item name with no modifications
 * @returns {Object} itemData - the data about the item in the database.
 */
async function getItemData(item) {
  let db = await getDBConnection();
  let itemData = await db.query("SELECT * FROM item WHERE name = $1", [item]);
  db.end();
  return itemData.rows;
}

/**
 * This function checks what combination of filters to apply then search the database to find
 * all the items that matches those filters.
 * @param {String} search - Search term
 * @param {String} item - Item name
 * @param {String} type - Item type
 * @param {Integer} rating - Rating number (out of 5);
 * @returns {Object} result - The filter items
 */
 async function filter(search, item, type, rating) {
  let db = await getDBConnection();
  let result;

  if (!search && type && !rating) {
    result = await db.query("SELECT * FROM item WHERE type = $1;", [type]);
  } else if (search && !type && !rating) {
    result = await db.query("SELECT * FROM item WHERE name LIKE $1;", [item]);
  } else if (search && type && !rating) {
    result = await db.query("SELECT * FROM item WHERE (name LIKE $1 AND type = $2);", [item, type]);
  } else if (rating && search && !type) {
    result = await db.query("SELECT * FROM item WHERE name LIKE $1 AND rating >= $2;", [item, rating]);
  } else if (rating && !search && !type) {
    result = await db.query("SELECT * FROM item WHERE rating >= $1;", [rating]);
  } else if (rating && search && type) {
    let qry = "SELECT * FROM item WHERE name LIKE $1 AND rating >=$2 AND type = $3;";
    result = await db.query(qry, [item, rating, type]);
  }

  db.end();
  return result.rows;
}

/**
 * This function modifies the entire database to process the item transaction by inserting it to the
 * purchase table then updates the correlating values such as money used, item bought, item stock
 * to reflect the updated state of the store after the transaction.
 * @param {Object} accountData - Information of the user's account
 * @param {Object} itemData - Information of the item being sold.
 * @param {Integer} itemAmount - The amount of the item is being sold.
 * @param {Integer} purchaseID - The purchase ID of the transaction.
 * @returns {Object} json - Information about the transaction after it is completed.
 */
async function transaction(accountData, itemData, itemAmount, purchaseID) {
  let db = await getDBConnection();
  let lastID = await db.query("SELECT MAX(id) FROM purchase");
  let newID = lastID["rows"][0]["max"] + 1;
  let purchaseQry = "INSERT INTO purchase (id, purchase_id, account_id, item_id, amount, item_cost)" +
  "VALUES ($1, $2, $3, $4, $5, $6);";

  let money = accountData.money;
  let accountID = accountData.account_id;

  let itemCost = itemData.price;
  let itemStock = itemData.stock;
  let itemID = itemData.item_id;
  let itemCostTotal = itemCost * itemAmount;

  let newMoneyTotal = (money - itemCostTotal).toFixed(2);
  let updateMoneyQry = "UPDATE account SET money = $1 WHERE account_id = $2";
  let newStockTotal = itemStock - itemAmount;
  if (itemStock === -1) {
    newStockTotal = -1;
  }
  let updateStockQry = "UPDATE item SET stock = $1 WHERE item_id = $2";

  await db.query(purchaseQry, [newID, purchaseID, accountID, itemID, itemAmount, itemCostTotal]);
  await db.query(updateStockQry, [newStockTotal, itemID]);
  await db.query(updateMoneyQry, [newMoneyTotal, accountID]);

  let json = {
    "new_stock_total": newStockTotal,
    "purchase_id": purchaseID,
    "itemCost": itemCostTotal,
    "money": newMoneyTotal
  };

  db.end();
  return json;
}

/**
 * This function checks the purchase table to see if the given purchaseID is unique or not.
 * @param {Integer} purchaseID - Generated purchase Id for transactions
 * @returns {Object} purchaseIDData - the given purchaseID or a randomized one.
 */
async function checkPurchaseID(purchaseID) {
  if (isNaN(purchaseID)) {
    return await generateUniquePurchaseID();
  } else {
    let db = await getDBConnection();
    let qry = "SELECT purchase_id FROM purchase WHERE purchase_id = $1;";
    let purchaseIDData = await db.query(qry, [purchaseID]);

    let newPurchaseID = purchaseID;

    if (purchaseIDData.rows.length === 0) {
      newPurchaseID = await generateUniquePurchaseID();
    }

    db.end();
    return newPurchaseID;
  }
}

/**
 * The function generates a Purchase ID that is unique to the purchase database.
 * @returns {Integer} - A randomly unique number for purchase ID.
 */
async function generateUniquePurchaseID() {
  let db = await getDBConnection();
  let uniqueNumberCheck = false;
  let qry = "SELECT purchase_id FROM purchase WHERE purchase_id = $1;";
  let uniqueNumber;

  while (!uniqueNumberCheck) {
    uniqueNumber = Math.floor(Math.random() * 100000);
    let result = await db.query(qry, [uniqueNumber]);
    if (result.rows.length === 0) {
      uniqueNumberCheck = true;
    }
  }
  db.end();
  return uniqueNumber;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = new Client({
    user: "ryanle",
    password: "1",
    host: "localhost",
    port: 5432,
    database: "postgres"
  })
  db.connect();
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || 8000;
app.listen(PORT);