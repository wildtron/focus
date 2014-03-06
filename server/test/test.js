var should = require('chai').should(),
    request = require('supertest'),
    api = request('http://localhost:3000');

describe('Instructor Authentication', function() {
    it('should be a bad request', function(done) {
        api.post('/instructor/login')
        .send({username : 'mamkat'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
            res.body.should.have.ownProperty('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('password is missing');
            done();
        });
    });

    it('should not login mam kat', function(done) {
        api.post('/instructor/login')
        .send({username : 'mamka', password : '12345'})
        .expect(401)
        .end(function (err, res) {
            should.not.exist(err);
            done();
        });
    });

    it('should login in mam kat', function(done) {
        api.post('/instructor/login')
        .send({username : 'mamkat', password : '12345'})
        .expect(200)
        .end(function (err, res) {
            should.not.exist(err);
            res.should.have.classes;
            res.should.have.access_token;
            done();
        });
    });
});