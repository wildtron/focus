var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

server = (process.env['NODE_ENV'] !== 'testing') ? 'http://localhost:3000' : require(__dirname + '/../server');
api = request(server);

describe('Instructor Authentication', function () {

    it('should look for missing password', function (done) {
        api.post('/instructor/login')
        .send({username : 'mamkat'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
            res.body.should.be.an('object');
            res.body.should.have.ownProperty('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('password is missing');
            done();
        });
    });

    it('should look for missing username', function (done) {
        api.post('/instructor/login')
        .send({password : '12345'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
            res.body.should.be.an('object');
            res.body.should.have.ownProperty('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('username is missing');
            done();
        });
    });

    it('should not login mam kat', function (done) {
        api.post('/instructor/login')
        .send({username : 'mamka', password : '12345'})
        .expect(401)
        .end(function (err, res) {
            should.not.exist(err);
            done();
        });
    });

    it('should login mam kat', function (done) {
        api.post('/instructor/login')
        .send({username : 'mamkat', password : '12345'})
        .expect(200)
        .end(function (err, res) {
            should.not.exist(err);
            res.headers.should.have.ownProperty('set-cookie');
            res.headers['set-cookie'].should.be.an('array');
            res.body.should.be.an('object');
            res.body.should.have.ownProperty('classes');
            res.body.should.have.ownProperty('_id');
            res.body.should.have.ownProperty('first_name');
            res.body.should.have.ownProperty('middle_name');
            res.body.should.have.ownProperty('last_name');
            res.body.should.have.ownProperty('sex');
            res.body.should.not.have.ownProperty('password');
            res.body.should.not.have.ownProperty('access_token');
            done();
        });
    });
});
