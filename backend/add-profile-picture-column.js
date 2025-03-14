const mysql = require('mysql');

// Create a connection to the database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'lnhsportal'
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to database');

  // Check if the column already exists
  const checkColumnQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'lnhsportal'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'profile_picture_url'
  `;

  db.query(checkColumnQuery, (err, results) => {
    if (err) {
      console.error('Error checking for column:', err);
      db.end();
      process.exit(1);
    }

    if (results.length > 0) {
      console.log('Column profile_picture_url already exists in users table');
      db.end();
      process.exit(0);
    }

    // Add the column if it doesn't exist
    const addColumnQuery = `
      ALTER TABLE users
      ADD COLUMN profile_picture_url VARCHAR(255) DEFAULT NULL
    `;

    db.query(addColumnQuery, (err, results) => {
      if (err) {
        console.error('Error adding column:', err);
        db.end();
        process.exit(1);
      }

      console.log('Successfully added profile_picture_url column to users table');
      db.end();
      process.exit(0);
    });
  });
}); 