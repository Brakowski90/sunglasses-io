//Server.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
//const swaggerUi = require('swagger-ui-express');
//const YAML = require('yamljs');
//const swaggerDocument = YAML.load('./swagger.yaml');
const users = require('../initial-data/users.json');
const brands = require('../initial-data/brands.json');
const products = require('../initial-data/products.json');

const app = express();
const PORT = process.env.PORT || 4005;
//const JWT_KEY = 'secretKey';
const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';

// Swagger documentation
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(err.message || 'Something broke!');
});

// Authentication middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No Authorization header found');
        return res.sendStatus(401);
    }

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log('Received token:', token); // Debug log: Check if token is received correctly

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT verification failed:', err.message); // Debug log: Log JWT verification failure
                return res.sendStatus(403);
            }

            console.log('JWT verification successful'); // Debug log: Log successful JWT verification
            req.user = user;
            next();
        });
    }
};

// 1 Get Brands
app.get('/api/brands', (req, res) => {
    res.json(brands);
});

// 2 Get Product from Brand 
app.get('/api/brands/:brandId/products', (req, res) => {
    const brandId = req.params.brandId;
    const productsFromBrandId = products.filter(product => product.categoryId == brandId);
    res.json(productsFromBrandId);
});

// 3 Get Products 
app.get('/products', (req, res) => {
    res.json(products);
});

// 4 Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }

    let signedInUser = users.find((user) => {
        return user.login.username === username && user.login.password === password;
    });

    if (!signedInUser) {
        return res.status(401).send("Invalid username or password");
    }
    // Include userId in the token payload
    const tokenPayload = {
        userId: signedInUser.userId, // UserId is in the user object
        username: signedInUser.login.username
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);
    res.json({ accessToken: token });
});

// 5 Get user's cart
app.get('/api/me/cart', authenticateJWT, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const user = users.find(user => user.login.username === req.user.username);

    if (user) {
        res.status(200).json(user.cart);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// 6 Post user's cart
app.post('/api/me/cart', authenticateJWT, (req, res) => {
    const username = req.user.username; 
    const productId = req.body.productId;

    // Check if productId is provided
    if (!productId) {
        return res.status(400).send("Product ID required!");
    }

    // Find the user from authenticated username
    const user = users.find((user) => user.login.username === username);
    if (!user) {
        return res.status(404).json({ error: 'User not found!' });
    }

    // Find the product from the productId
    const productToAdd = products.find((product) => product.id === productId);
    if (!productToAdd) {
        return res.status(404).json({ error: 'Product not found!' });
    }

    // Check if a product already exists in the user's cart
    const existingCartItem = user.cart.find(item => item.product.id === productId);
    if (existingCartItem) {
        // If the product already exists, increment its quantity
        existingCartItem.quantity++;
    } else {
        // If the product is not in the cart, add it with quantity 1
        user.cart.push({ product: productToAdd, quantity: 1 });
    }
    // Return the updated cart
    res.status(201).json(user.cart);
});

// 7 Add Post user's cart product
app.post('/api/me/cart/:productId', authenticateJWT, (req, res) => {
    const user = users.find(user => user.login.username === req.user.username);
    if (!user) return res.status(404).json({ error: 'User not found!' });

    const productId = req.params.productId;
    const productToAdd = products.find(product => product.id === productId);
    if (!productToAdd) return res.status(404).json({ error: 'Product not found!' });

    const index = user.cart.findIndex(item => item.product.id === productId);
    if (index !== -1) user.cart[index].quantity++;
    else user.cart.push({ product: productToAdd, quantity: 1 });

    res.status(200).json(user.cart);
});

// 8 Delete product from user's cart 
app.delete('/api/me/cart/:productId', authenticateJWT, (req, res) => {
    const username = req.user.username; // Authenticated user is stored in req.user

    // Find the user from authenticated username
    const user = users.find(user => user.login.username === username);
    if (!user) {
        return res.status(404).json({ error: 'User not found!' });
    }

    // Find the index of the product in cart
    const index = user.cart.findIndex(item => item.product.id === req.params.productId);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found in the user\'s cart' });
    }

    // Remove the product from the user's cart
    user.cart.splice(index, 1);

    // Send the updated cart as the response
    res.status(200).json(user.cart);
});

// Server setup
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;