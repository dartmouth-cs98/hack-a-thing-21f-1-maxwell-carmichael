/**
 * This small program ran from pizza.sh, or can be run using "node pizza.sh" after running "npm install"
 * You need to have a mysql server running on localhost. I recommend using MySQL Workbench.
 * You also need to specify the port, user, and password in mysqlconfig.json
 * 
 * This creates three tables: items, customers, and purchases then creates an ordered aggregated table
 *   with information from all three tables.
 * 
 */


const mysql = require("mysql");
const mysqlconfig = require("./mysqlconfig.json");

/**
 * Create mysql.Connection "con"
 */ 
const con = mysql.createConnection({
  ...mysqlconfig,
  multipleStatements: true
});

/**
 * Connect to localhost promise
 */
const connectPromise = new Promise((resolve, reject) => {
  con.connect((err) => {
    if (err) reject(err);
    resolve();
  });
});

/**
 * Promise which creates three tables:
 *   items          (item_id,     name,        price)
 *   customers      (customer_id, first_name,  last_name, age)
 *   purchases      (purchase_id, customer_id, item_id,   date)
 * 
 * And some data inserted into each table
 */
const createDatabasePromise = new Promise((resolve, reject) => {
  con.query(
    `
    DROP DATABASE IF EXISTS pizzaparlor;
    CREATE DATABASE pizzaparlor;
    USE pizzaparlor;

    CREATE TABLE items (
      item_id tinyint(4) NOT NULL AUTO_INCREMENT,
      name varchar(50) NOT NULL,
      price decimal(9,2) NOT NULL,
      PRIMARY KEY (item_id)
    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    INSERT INTO items (name, price)
      VALUES
        ("pizza", 12.00),
        ("burger", 8.50),
        ("soda", 1.85);

    CREATE TABLE customers (
      customer_id tinyint(4) NOT NULL AUTO_INCREMENT,
      first_name varchar(50) NOT NULL,
      last_name varchar(50) NOT NULL,
      age int(11),
      PRIMARY KEY (customer_id)
    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    INSERT INTO customers (first_name, last_name, age)
      VALUES
        ("Jeffrey", "Mexico", 23),
        ("Kevin", "Calzone", 35),
        ("Rosa", "Topaz", 49),
        ("Henry", "Sunbutter", 44);
      
    CREATE TABLE purchases (
      purchase_id tinyint(4) NOT NULL AUTO_INCREMENT,
      customer_id tinyint(4) NOT NULL,
      item_id tinyint(4) NOT NULL,
      date date NOT NULL,
      PRIMARY KEY (purchase_id)
    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    INSERT INTO purchases (customer_id, item_id, date)
      VALUES
        (4, 1, "2021-05-09"),
        (2, 2, "2021-05-10"),
        (1, 1, "2021-05-09"),
        (4, 1, "2021-04-30"),
        (1, 2, "2021-05-13"),
        (3, 1, "2021-04-13"),
        (2, 3, "2021-05-01"),
        (1, 3, "2021-05-03"),
        (2, 1, "2021-04-17"),
        (1, 2, "2021-05-05");
        `,
    (err) => {
      if (err) throw reject(err);
      resolve();
    });
});

/**
 * Aggregate the three tables using JOINS and UNIONS:
 * 
 * Takes the purchases table, but instead of customer_id has the customer's first name,
 *   and instead of item_id has the name of the item. Also adds a new column "recency" which
 *   is "new" if the purchase was made after May 1, 2021, and "old" otherwise.
 * 
 */
const createAggregateTablePromise = new Promise((resolve, reject) => {
  con.query(`
      CREATE TABLE aggregate AS (
      SELECT
        p.purchase_id,
        c.first_name,
        i.name AS item,
        i.price,
        p.date,
        "new" AS recency
      FROM purchases p
      JOIN customers c
        USING (customer_id)
      JOIN items i
        USING (item_id)
      WHERE date >= "2021-05-01"
      UNION
      SELECT
        p.purchase_id,
        c.first_name,
        i.name AS item,
        i.price,
        p.date,
        "old" AS recency
      FROM purchases p
      JOIN customers c
        USING (customer_id)
      JOIN items i
        USING (item_id)
      WHERE date < "2021-05-01"
      ORDER BY first_name, date DESC
      );
    `, (err, result) => {
    if (err) reject(err);
    resolve(result);
  });
});

/**
 * Connects, creates the database with three tables, then creates a fourth aggregated table by
 * resolving all the promises written above. Then it closes the connection.
 * 
 * @returns {Promise}
 */
const main = async () => {
  try {
    await connectPromise;
    console.log("Connected!");

    await createDatabasePromise;
    console.log("Database created!");

    await createAggregateTablePromise;
    console.log("Aggregate table created!")
  }
  catch(error) {
    console.log("Error in main:", error);
  }

  await new Promise ((resolve, reject) => {
    con.end(err => {
      if (err) reject(err);
      resolve();
    });
  });
  
  return;
};

main();
