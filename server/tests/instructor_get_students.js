var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

server = (process.env['NODE_ENV'] !== 'testing') ? 'http://localhost:3000' : require(__dirname + '/../server');
api = request(server);

describe('Instructor get students', function() {
    it('should deny missing access token', function (done) {
		api.get('/section/getStudents?section_id=CMSC 161 UV-2L')
		.expect(401)
		.end(function (err, res) {
			should.not.exist(err);
			res.body.should.have.ownProperty('message');
			res.body.message.should.be.string;
			res.body.message.should.be.equal('Invalid access_token');
			done();
		})
    });

	it('should ask for missing section_id', function (done) {
		api.post('/instructor/login')
		.send({username : 'mamkat', password : '12345'})
		.expect(200)
		.end(function (err, res) {
			api.get('/section/getStudents')
			.set('cookie', res.headers['set-cookie'])
			.expect(400)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.ownProperty('message');
				res.body.message.should.be.string;
				res.body.message.should.be.equal('section_id is missing');
				done();
			})
        });
    });

	it('should get students', function (done) {
		api.post('/instructor/login')
		.send({username : 'mamkat', password : '12345'})
		.expect(200)
		.end(function (err, res) {
			api.get('/section/getStudents?section_id=CMSC 161 UV-2L')
			.set('cookie', res.headers['set-cookie'])
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.be.an('array');
				done();
			})
        });
    });
});
