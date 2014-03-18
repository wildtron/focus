var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

server = (process.env['NODE_ENV'] !== 'testing') ? 'http://localhost:3000' : require(__dirname + '/../server');
api = request(server);

describe('Student Authentication', function() {

    it('should look for missing access_token', function (done) {
        api.post('/student/login')
        .send({username : 'mamkat', password : '12345', student_number : '#'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('access_token is missing');
            done();
        });
    });

    it('should look for missing student_number', function (done) {
        api.post('/student/login')
        .send({username : 'mamkat', password : '12345', access_token : '#'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('student_number is missing');
            done();
        });
    });

    it('should look for missing password', function (done) {
        api.post('/student/login')
        .send({student_number : '2010-43168', username : 'tester', access_token : '#'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('password is missing');
            done();
        });
    });

    it('should look for missing username', function (done) {
        api.post('/student/login')
        .send({student_number : '2010-43168', password : 'asdfasdf', access_token : '#'})
        .expect(400)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('username is missing');
            done();
        });
    });

    it('should not login student tester', function (done) {
        api.post('/student/login')
        .send({student_number : '2010-43168', username : 'tester', password : '12345', access_token : '#'})
        .expect(401)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.equal('Wrong username or password');
            done();
        });
    });

    it('should login in ravenjohn', function (done) {
        api.post('/student/login')
        .send({student_number : '2010-43168', username : 'ravenjohn', password : 'asdfasdf', access_token : '#'})
        .expect(200)
        .end(function (err, res) {
            should.not.exist(err);
			res.body.should.have.keys('access_token', 'instructor');
			res.body.instructor.should.be.string;
			res.body.access_token.should.be.string;
			res.body.access_token.should.have.length(32);
            done();
        });
    });
});
