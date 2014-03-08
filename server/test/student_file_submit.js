var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

process.env['NODE_ENV'] = 'testing';
server = require(__dirname + '/../server');
api = request(server);

describe('Student File Submit', function() {
	it('should send a file successfully', function (done) {
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
				done();
			});
        });

    });
	it('should ask for missing access_token', function (done) {
		api.post('/student/submit')
		.attach('file', __dirname + '/fixtures/input.txt')
		.expect(400)
		.end(function (err, res) {
			should.not.exist(err);
			done();
		});
	});
});
