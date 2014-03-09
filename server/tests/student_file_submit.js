var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

server = (process.env['NODE_ENV'] !== 'testing') ? 'http://localhost:3000' : require(__dirname + '/../server');
api = request(server);

describe('Student File Submit', function() {
	it('should ask for missing access_token', function (done) {
		api.post('/student/submit')
		.attach('file', __dirname + '/fixtures/input.txt')
		.expect(400)
		.end(function (err, res) {
			should.not.exist(err);
			res.body.should.have.keys('message');
            res.body.message.should.be.string;
            res.body.message.should.be.equal('access_token is missing');
			done();
		});
	});

	it('should ask for missing file', function (done) {
		api.post('/student/login')
		.send({student_number : '2010-43168', username : 'ravenjohn', password : 'asdfasdf'})
		.expect(200)
		.end(function (err, res) {
			api.post('/student/submit')
			.field('access_token', res.body.access_token)
			.expect(400)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.keys('message');
				res.body.message.should.be.equal('file is missing');
				done();
			});
        });
    });

	it('should send 1 file successfully', function (done) {
		api.post('/student/login')
		.send({student_number : '2010-43168', username : 'ravenjohn', password : 'asdfasdf'})
		.expect(200)
		.end(function (err, res) {
			api.post('/student/submit')
			.field('access_token', res.body.access_token)
			.attach('file', __dirname + '/fixtures/input.txt')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.keys('message');
				res.body.message.should.be.equal('Successfully submitted 1 file');
				done();
			});
        });
    });

	it('should send 2 files successfully', function (done) {
		api.post('/student/login')
		.send({student_number : '2010-43168', username : 'ravenjohn', password : 'asdfasdf'})
		.expect(200)
		.end(function (err, res) {
			api.post('/student/submit')
			.field('access_token', res.body.access_token)
			.attach('file', __dirname + '/fixtures/lagrimas_exer1.txt')
			.attach('file', __dirname + '/fixtures/lagrimas_exer2.txt')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.keys('message');
				res.body.message.should.be.equal('Successfully submitted 2 files');
				done();
			});
        });
    });
});
