const mysql = require("mysql");
const mysqlconfig = require("./mysqlconfig.json");

const con = mysql.createConnection({
  ...mysqlconfig,
  multipleStatements: true
});

// first try to connect
con.connect((err) => {
  if (err) throw err;
  console.log("Connected!");

  // then create the base database
  con.query(
    `
    DROP DATABASE IF EXISTS mydb;
    CREATE DATABASE mydb;
    USE mydb;

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
    if (err) throw err;
    console.log("Database created");

    con.query(`
      CREATE TABLE aggregate AS (
      SELECT
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
      ORDER BY first_name, date
      );
    `, (err, result) => {
      if (err) throw err;
      console.log("Result:\n", result);
    });
  });
});
