//server.test.js

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server');

const should = chai.should();
chai.use(chaiHttp);

describe('Server', () => {
    // Test for GET /api/brands
    describe('GET /api/brands', () => {
        it('it should return all brands', (done) => {
            chai.request(server)
                .get('/api/brands')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    done();
                });
        });
    });

    // Test for POST /api/login
    describe('POST /api/login', () => {
        it('it should authenticate the user and return an access token', (done) => {
            chai.request(server)
                .post('/api/login')
                .send({ username: 'yellowleopard753', password: 'jonjon' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken; // Define accessToken here
                    done();
                });
        });
    });

    // Test for GET /api/me/cart
    describe('GET /api/me/cart', () => {
        it('it should return the user\'s cart', (done) => {
            chai.request(server)
                .get('/api/me/cart')
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    done();
                });
        });

        it('should return 401 without access token', (done) => {
            chai.request(server)
                .get('/api/me/cart')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    // Test for GET /products
    describe('GET /products', () => {
        it('should get a list of all products', done => {
            chai.request(server)
                .get('/products')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    done();
                });
        });
    });

});