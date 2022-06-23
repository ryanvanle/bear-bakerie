# Bear Bakerie API Documentation
The Bear Bakerie API provides information about Bear Bakerie items, filtering of items, processing transactions, and account features.
## Get all items in the database or get one item.
**Request Format:** /menu

**Optional Query:** ?item=

**Request Type:** GET

**Returned Data Format**: JSON

**Description 1:** Return a list of all of the Items in the Bear Bakerie.

**Example Request 1:** /menu

**Example Response 1:**
```json
[
  {
    "item_id": 1,
    "name": "capybara cake",
    "description": "a cheesecake with capybara and pelican decorations on top.",
    "image": "capybara.png",
    "price": 33.79,
    "rating": 5,
    "type": "cakes",
    "stock": 12,
    "source": "rin's forest"
  },
  {
    "item_id": 2,
    "name": "strawberry heart cake",
    "description": "a strawberry shortcake shaped like a heart.",
    "image": "strawberry-heart.png",
    "price": 29.3,
    "rating": 5,
    "type": "cakes",
    "stock": 12,
    "source": "aprilsbakerlondon"
  },
  {
    "item_id": 3,
    "name": "flower latte",
    "description": "a latte with foam art in the shape of a flower, topped with cocoa.",
    "image": "flower-latte.png",
    "price": 6.5,
    "rating": 4,
    "type": "drinks",
    "stock": 16,
    "source": "cafe_bymin"
  } ...
]
```
**Description 2:** Returns all items where the item name matches any item in Bear Bakerie.

**Example Request 2:** /menu?item=heart bun

**Example Response 2:**
```json
[
  {
    "item_id": 23,
    "name": "heart bun",
    "description": "a bread bun shaped as a heart and made with love.",
    "image": "heart-bun.png",
    "price": 3,
    "rating": 4,
    "rating_amount": 3,
    "type": "breads",
    "stock": 21,
    "source": "strawberry4milk"
  }
]
```
**Error Handling:**
- N/A


## Login into an Account
**Request Format:** /account endpoint with POST parameters of `username` and `password`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given a valid account `username` and `password` to send, the API will check if the account exist in the database and return the account name and balance.

**Example Request:** /account with POST parameters of `username=Test` and `password=NotARealAccount`

**Example Response:**
```json
{
  "name": "Test",
  "money": 200
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If username and/or password is incorrect, an error is returned with: `Invalid Username and/or Password.`


## Filter the Bear Bakerie items
**Request Format:** /filter endpoint with POST parameters of `item`, `type`, `rating`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given a valid `search`, and/or `type`, and/or `rating` to send, the database will return the items that matches those parameters

**Example Request 1:** /filter with POST parameters of `type=cakes`

**Example Response 1:**
```json
[
  {
    "item_id": 1,
    "name": "capybara cake",
    "description": "a cheesecake with capybara and pelican decorations on top.",
    "image": "capybara.png",
    "price": 33.79,
    "rating": 5,
    "type": "cakes",
    "stock": 12,
    "source": "rin's forest"
  },
  {
    "item_id": 2,
    "name": "strawberry heart cake",
    "description": "a strawberry shortcake shaped like a heart.",
    "image": "strawberry-heart.png",
    "price": 29.3,
    "rating": 5,
    "type": "cakes",
    "stock": 12,
    "source": "aprilsbakerlondon"
  },
  {
    "item_id": 4,
    "name": "peach cake",
    "description": "a sponge cake made out of peaches! real peaches, not an actual sponge! peaches sourced locally.",
    "image": "peach-cake.png",
    "price": 30.58,
    "rating": 4,
    "type": "cakes",
    "stock": 10,
    "source": "strawberry4milk"
  } ...
]
```

**Example Request 2:** /filter with POST parameters of `type=breads`, `search=loaf`

**Example Response 2:**
```json
[
  {
    "item_id": 12,
    "name": "panda loaf",
    "description": "a loaf of bread with the inside having the picture of a panda.",
    "image": "panda-loaf.png",
    "price": 10,
    "rating": 1,
    "type": "breads",
    "stock": 23,
    "source": "honeyrolls"
  },
  {
    "item_id": 21,
    "name": "bread loaf",
    "description": "the signature Bear Bakerie milk bread loaf, consisting of 12 thick slices!",
    "image": "loaf.png",
    "price": 8,
    "rating": 5,
    "type": "breads",
    "stock": 40,
    "source": "strawberry4milk"
  }
]
```
**Example Request 3:** /filter with POST parameters of `type=breads`, `search=loaf`, `rating=4`

**Example Response 3:**
```json
[
  {
    "item_id": 21,
    "name": "bread loaf",
    "description": "the signature Bear Bakerie milk bread loaf, consisting of 12 thick slices!",
    "image": "loaf.png",
    "price": 8,
    "rating": 5,
    "type": "breads",
    "stock": 40,
    "source": "strawberry4milk"
  }
]
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If all three POST parameters are missing, the API will reply with the error: `All parameters are missing!`


## Buy an Bear Bakerie Item(s)
**Request Format:** /purchase endpoint with the required POST parameters of `item`, `amount`, `username`, and optional `pid`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given a valid `username` and `item` name, and item `amount` to send, the item will be purchased and receipt will be returned. If the `pid` is filled with an integer, it will replaced the randomly generated purchased ID with the given `pid`.

**Example Request:** /purchase with POST parameters of `username=Ryan`, `item=a slice of bread` and `amount=15`

**Example Response:**
```json
{
  "new_stock_total": 106,
  "purchase_id": 2340,
  "itemCost": 22.5,
  "money": "11977.50"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the item or username POST parameters does not link to any entry to the database or the item amount is null, an error is returned with: `Invalid User or Item or Amount!`
  - If the item stock is less than the buying amount, an error is returned with: `Item amount is greater than the item stock!`
  - If the account total balance is less than total cost, an error is returned with: `Total cost is greater than the account money!`


## Account Transaction History
**Request Format:** /account/history endpoint with the POST parameters of `username`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given a valid account `username`, the account transaction history will be returned back.

**Example Request:** /account/history with POST parameters of `name=Ryan`

**Example Response:**
```json
]
  {
    "name": "hotdog bread",
    "item_id": 13,
    "item_cost": 8,
    "amount": 2,
    "purchase_id": 55786,
    "account_id": 3
  },
  {
    "name": "hotdog bread",
    "item_id": 13,
    "item_cost": 8,
    "amount": 2,
    "purchase_id": 93208,
    "account_id": 3
  },
  {
    "name": "heart bun",
    "item_id": 23,
    "item_cost": 6,
    "amount": 2,
    "purchase_id": 93208,
    "account_id": 3
  },
  {
    "name": "a slice of bread",
    "item_id": 11,
    "item_cost": 22.5,
    "amount": 15,
    "purchase_id": 2340,
    "account_id": 3
  }
]
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the account username does not exist in the database, an error will be returned: `Invalid username!`

## Create a new User
**Request Format:** /account/new endpoint with the POST parameters of username, password, email.

**Request Type**: POST

**Returned Data Format**: text

**Description:** Given a valid unique account `username`, `password`, and unique`email` a new user will be created and added to the server and return with a success message.

**Example Request:** /account/new with POST parameters of `name=Alex`, `password=password`, `email=alex@uw.edu`

**Example Response:**
```
Successfully created
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the username is not unique, email is not unique, password does not exist, an error will be returned: `Invalid Parameters! Username, password, or email`


## Insert money into a User's balance
**Request Format:** /account/money endpoint with POST parameters of `username` and `money`

**Request Type**: POST

**Returned Data Format**: Plain Text

**Description:** Given a valid account `username` and valid real number `amount` to send, the amount will be added to account balance

**Example Request:** /account/money with POST parameters of `username=Alex` and `amount=50`

**Example Response:**
```
50
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the username does not connect to an account and the money is not valid (e.g it is a string), an error will be returned: `Invalid Account or money parameter!`