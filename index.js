const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser'); // Import body-parser (not required in Express 4.16+)
const path = require('path');
const fs = require('fs');

// Create a new web application by calling the express function
const app = express();
const port = 3000;

let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('myDB');
const bcrypt = require('bcrypt');
// Middleware to parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true })); // This is necessary to parse form data
app.use(morgan('common')); // Include logging for all requests
app.use(express.static('public_html')); // Serve static files
app.use(express.json()); 
app.use(session({
    secret: 'SIT774',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));
let cart = [];

let users = [];

let currUser = {};

db.all('SELECT * FROM User', function(err, rows){
    if (err) {
        return console.error(err.message);
    }
    if (rows.length === 0) { 
        console.log("No User in the list!") 
        
    } else {
        rows.forEach(user => {
            let account = {username : user.username, password : user.password, email : user.email}
            users.push(account);
        });
        console.log(users);
        
    }
});

// Read products.json file on server startup
let products = [];
fs.readFile(path.join(__dirname, 'public_html', 'data', 'products.json'), 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading products.json:', err);
    } else {
        products = JSON.parse(data);
        console.log('Products loaded successfully.');
    }
});

// Function to add a product to the cart
function addToCart(index) {
    let i = parseInt(index);
    let addedProduct = products[i];

    if (cart.some(e => e.name === addedProduct.name)) {
        cart.forEach(product => {
            if (product.name === addedProduct.name) {
                product.quantity += 1; // Increase quantity if item already in cart
            }
        });
    } else {
        addedProduct.quantity = 1; // Initialize quantity
        addedProduct.size = 'XS';
        cart.push(addedProduct); // Add new item to cart
    }

    console.log(cart); // For debugging
}


// Route to handle the root request
app.get('/', (req, res, next) => {
    
    res.render('index', { title: 'SARA Shop' });
    db.all('SELECT * FROM Message', function(err, rows) {
        if (err) {
            return console.error(err.message);
        }
        rows.forEach(function (row) {
            let member = {};
            member.name = row.name;
            member.email = row.email;
            member.subject = row.subject;
            member.message = row.message;
            console.log(member);
        });
    });
    
});

// Route to add an item to the cart via API
app.post('/addToCart', (req, res) => {
    const {index} = req.body;
    console.log(index);
    
    if (index !== undefined && index >= 0 && index < products.length) {
        addToCart(index); // Call server-side addToCart function
        
        res.json({ message: products[index].name + ' added to cart successfully!', cart }); // Send JSON response
        
    } else {
        
        res.status(400).json({ error: 'Invalid product index.' }); // Send error response
    }
});


app.post('/validateAccount', (req, res) => {
    const { username, email } = req.body;

    // Check if username or email already exists in the users array
    const usernameExists = username ? users.some(user => user.username === username) : false;
    const emailExists = email ? users.some(user => user.email === email) : false;

    if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken.' });
    }
    
    if (emailExists) {
        return res.status(400).json({ message: 'Email is already registered.' });
    }

    res.json({ message: 'Available' });
});

app.post('/createAccount', async (req, res) => {
    const { username, password, email } = req.body;

    // Check if the username or email already exists
    const userExists = users.some(user => user.username === username || user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'Username or email is already taken.' });
    }

    if (username && password && email) {
        try {
            // Hash the password before saving it
            const saltRounds = 10; 
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            db.run(`INSERT INTO User (username, password, email) VALUES (?, ?, ?)`, [username, hashedPassword, email], (err) => {
                if (err) {
                    console.error('Error inserting user into database:', err.message);
                    return res.status(500).json({ message: 'Error saving user to database.' });
                }

                // Add the new user (with hashed password) to the users array
                users.push({ username, password: hashedPassword, email });
                res.json({ message: "Account created successfully!" });
            });
        } catch (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Error processing account creation.' });
        }
    } else {
        res.status(400).json({ message: 'Invalid account data.' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find the user by username
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ message: 'Error processing login.' });
        }

        if (isMatch) {
            // Set the username in the session
            req.session.username = username;
            res.json({ message: 'Login successful!', username });
        } else {
            res.status(400).json({ message: 'Invalid username or password.' });
        }
    });
});

// Route to remove an item from the cart via API
app.post('/removeFromCart', (req, res) => {
    const { index } = req.body;
    console.log(`Removing item at index: ${index}`);
    
    if (index !== undefined && index >= 0 && index < cart.length) {
        let itemName = cart[index].name;
        cart.splice(index, 1);  // Remove the item from the cart array
        res.json({ message: itemName + ' removed from cart successfully!', cart });  // Send updated cart
    } else {
        res.status(400).json({ error: 'Invalid product index.' });  // Send error response
    }
});

// Route to update an item's quantity in the cart
app.post('/updateCartQuantity', (req, res) => {
    const { index, quantity, size } = req.body;
    console.log(`Updating item at index: ${index} to quantity: ${quantity}`);
    
    if (index !== undefined && index >= 0 && index < cart.length) {
        cart[index].quantity = quantity;  // Update the item quantity in the cart array
        res.json({ message: 'Item quantity updated successfully!', cart });  // Send updated cart
    } else {
        res.status(400).json({ error: 'Invalid product index or quantity.' });  // Send error response
    }
});

// Route to update an item's size in the cart
app.post('/updateItemSize', (req, res) => {
    const { index, size } = req.body;
    console.log(`Updating item at index: ${index} to size: ${size}`);
    
    if (index !== undefined && index >= 0 && index < cart.length) {
        cart[index].size = size;  // Update the item size in the cart array
        res.json({ message: 'Item size updated successfully!', cart });  // Send updated cart
    } else {
        res.status(400).json({ error: 'Invalid product index or size.' });  // Send error response
    }
});

// Route to get current cart items
app.get('/getCart', (req, res) => {
    res.json(cart);  // Send the current cart to the client
});

// Route to get current cart items
app.get('/getCartLength', (req, res) => {
    res.json(cart.length);  // Send the current cart to the client
});

// Route to get current cart items
app.get('/getCurrentUser', (req, res) => {
    res.json(currUser);  // Send the current cart to the client
});





// Route to handle form submissions
app.post('/submitmessage', (req, res) => {
    // Ensure form data is being captured correctly
    console.log(req.body); // Debugging: Output the entire req.body to see if it contains the form fields

    // Extract data from request body
    let name = req.body.nameInput;
    let subject = req.body.subjectInput;
    let email = req.body.emailInput;
    let message = req.body.messageInput;

    if (name && subject && email && message) {
        db.run(`INSERT INTO Message (name, email, subject, message) VALUES (?, ?, ?, ?)`, [name, email, subject, message], (err) => {
            if (err) {
                console.error('Error inserting message into database:', err.message);
                return res.status(500).send('Error saving message to database.');
            }
            
            res.sendFile(path.join(__dirname, 'public_html', 'thankyou.html'));
        });
    } else {
        res.status(400).send('Invalid form submission.');
    }
    db.all('SELECT * FROM Message', function(err, rows) {
        if (err) {
            return console.error(err.message);
        }
        rows.forEach(function (row) {
            let member = {};
            member.name = row.name;
            member.email = row.email;
            member.subject = row.subject;
            member.message = row.message;
            console.log(member);
        });
    });
    
});

app.post('/checkout', (req, res) => {
    if (!req.session.username) {
        // User is not logged in
        return res.status(401).json({ message: 'You need to log in before placing an order.' });
    }

    if (cart.length > 0) {
        let total = 0;
        let itemList = cart.map(item => {
            const itemPrice = parseFloat(item.price.replace('$', ''));
            total += itemPrice * item.quantity;
            return `---[${item.name}-${item.size}-${item.quantity}]---`;
        }).toString();

        // Insert order with the current username into the database
        db.run(`INSERT INTO OrderTable (username, items, total) VALUES (?, ?, ?)`, [req.session.username, itemList, total.toString()], (err) => {
            if (err) {
                console.error('Error inserting order into database:', err.message);
                return res.status(500).send('Error saving order to database.');
            }
            cart = []; // Clear cart after order is placed
            res.sendFile(path.join(__dirname, 'public_html', 'thankyou.html'));
        });
    } else {
        res.status(400).json({ message: 'Your cart is empty. Please add items to your cart before checking out.' });
    }
});

app.get('/showAllOrder', function (req, res) {
    let html = '';
  
    // HTML code to display a table populated with the data from the DB
    
    html += '<!doctype html><html lang="en">';
    html += '<head>';
    html += '<title>Bootstrap Express/SQLite3 Demo</title>';
    html += '<meta charset="utf-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
    html += '<link rel="stylesheet"';
    html += '  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha2/dist/css/bootstrap.min.css"';
    html += '  integrity="sha384-aFq/bzH65dt+w6FI2ooMVUpc+21e0SRygnTpmBvdBgSdnuTN7QbdgL+OapgHtvPp"';
    html += '  crossorigin="anonymous">';
    html += '</head>';
  
    html += '<body><div class="container">';
    html += '<h3> All Orders </h3>';
    html += '<table class="table">';
    html += '<thead class="thead-dark"><tr>';
    html += '<th>OrderId</th><th>Username</th><th>Items</th><th>Total</th>';
    html += '<tr></thead><tbody>';
    
    // Retrieve data from table User on the server 
    // and display it in a web page table structure
    db.all('SELECT * FROM OrderTable', function(err, rows){
        if (err) {
            return console.error(err.message);
        }
        if (rows.length === 0) { 
            console.log("Array is empty!") 
            html += '<tr><td colspan="3"> No data found </td></tr>';
        } else {
            rows.forEach(function (row){
                html += '<tr>';
                html += '<td>'+row.id+'</td>';
                html += '<td>'+row.username+'</td>';
                html += '<td>'+row.items+'</td>';
                html += '<td>'+row.total+'</td>';
                html += '</tr>';
            });
        }
  
        html += '</tbody></table>';
        html += '</div>';
        html += '</body></html>';
        res.send( html );
    });

});

app.get('/showAllUser', function (req, res) {
    let html = '';
  
    // HTML code to display a table populated with the data from the DB
    
    html += '<!doctype html><html lang="en">';
    html += '<head>';
    html += '<title>Bootstrap Express/SQLite3 Demo</title>';
    html += '<meta charset="utf-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
    html += '<link rel="stylesheet"';
    html += '  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha2/dist/css/bootstrap.min.css"';
    html += '  integrity="sha384-aFq/bzH65dt+w6FI2ooMVUpc+21e0SRygnTpmBvdBgSdnuTN7QbdgL+OapgHtvPp"';
    html += '  crossorigin="anonymous">';
    html += '</head>';
  
    html += '<body><div class="container">';
    html += '<h3> All Orders </h3>';
    html += '<table class="table">';
    html += '<thead class="thead-dark"><tr>';
    html += '<th>Id</th><th>Username</th><th>Password</th><th>Email</th>';
    html += '<tr></thead><tbody>';
    
    // Retrieve data from table User on the server 
    // and display it in a web page table structure
    db.all('SELECT * FROM User', function(err, rows){
        if (err) {
            return console.error(err.message);
        }
        if (rows.length === 0) { 
            console.log("Array is empty!") 
            html += '<tr><td colspan="3"> No data found </td></tr>';
        } else {
            rows.forEach(function (row){
                html += '<tr>';
                html += '<td>'+row.id+'</td>';
                html += '<td>'+row.username+'</td>';
                html += '<td>'+row.password+'</td>';
                html += '<td>'+row.email+'</td>';
                html += '</tr>';
            });
        }
  
        html += '</tbody></table>';
        html += '</div>';
        html += '</body></html>';
        res.send( html );
    });

});

app.get('/showAllMessage', function (req, res) {
    let html = '';
  
    // HTML code to display a table populated with the data from the DB
    
    html += '<!doctype html><html lang="en">';
    html += '<head>';
    html += '<title>Bootstrap Express/SQLite3 Demo</title>';
    html += '<meta charset="utf-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
    html += '<link rel="stylesheet"';
    html += '  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha2/dist/css/bootstrap.min.css"';
    html += '  integrity="sha384-aFq/bzH65dt+w6FI2ooMVUpc+21e0SRygnTpmBvdBgSdnuTN7QbdgL+OapgHtvPp"';
    html += '  crossorigin="anonymous">';
    html += '</head>';
  
    html += '<body><div class="container">';
    html += '<h3> All Message </h3>';
    html += '<table class="table">';
    html += '<thead class="thead-dark"><tr>';
    html += '<th>Id</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th>';
    html += '<tr></thead><tbody>';
    
    // Retrieve data from table User on the server 
    // and display it in a web page table structure
    db.all('SELECT * FROM Message', function(err, rows){
        if (err) {
            return console.error(err.message);
        }
        if (rows.length === 0) { 
            console.log("Array is empty!") 
            html += '<tr><td colspan="3"> No data found </td></tr>';
        } else {
            rows.forEach(function (row){
                html += '<tr>';
                html += '<td>'+row.id+'</td>';
                html += '<td>'+row.name+'</td>';
                html += '<td>'+row.email+'</td>';
                html += '<td>'+row.subject+'</td>';
                html += '<td>'+row.message+'</td></tr>';
            });
        }
  
        html += '</tbody></table>';
        html += '</div>';
        html += '</body></html>';
        res.send( html );
    });
  });

// Error routes
app.get('/forceerror', (req, res) => {
    console.log('Got a request to force an error...');
    let f;
    console.log(`f = ${f.nomethod()}`); // This will cause an error
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 - File not found');
});

// 500 handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500: ' + err);
});

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Web server running at: http://localhost:${port}`);
        console.log(`Type Ctrl+C to shut down the web server`);
    });
}

// Export the app for testing
module.exports = app;
