CREATE TABLE IF NOT EXISTS "account" (
	"account_id"	INTEGER,
	"name"	TEXT UNIQUE,
	"password"	TEXT,
	"email"	TEXT UNIQUE,
	"money"	REAL,
	PRIMARY KEY("account_id")
);

CREATE TABLE IF NOT EXISTS "item" (
	"item_id"	INTEGER,
	"name"	TEXT,
	"description"	TEXT,
	"image"	TEXT,
	"price"	REAL,
	"rating"	INTEGER,
	"type"	TEXT,
	"stock"	INTEGER,
	"source"	TEXT,
	PRIMARY KEY("item_id")
);

CREATE TABLE IF NOT EXISTS "purchase" (
	"id"	INTEGER,
	"purchase_id"	INTEGER,
	"account_id"	INTEGER,
	"item_id"	INTEGER,
	"amount"	INTEGER,
	"item_cost"	REAL,
	FOREIGN KEY("item_id") REFERENCES "item"("item_id"),
	FOREIGN KEY("account_id") REFERENCES "account"("account_id"),
	PRIMARY KEY("id")
);
