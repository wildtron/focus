var should = require('chai').should(),
    request = require('supertest'),
	server,
	api;

server = (process.env['NODE_ENV'] !== 'testing') ? 'http://localhost:3000' : require(__dirname + '/../server');
api = request(server);

describe('Instructor get students', function() {
    it('should deny missing access token', function (done) {
		api.get('/section/getStudentsWithFiles?section_id=CMSC 161 UV-2L&order=date&student_number=2010-43168&exer_number=1')
		.expect(401)
		.end(function (err, res) {
			should.not.exist(err);
			res.body.should.have.keys('message');
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
			api.get('/section/getStudentsWithFiles?order=date&student_number=2010-43168&exer_number=1')
			.set('cookie', res.headers['set-cookie'])
			.expect(400)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.keys('message');
				res.body.message.should.be.string;
				res.body.message.should.be.equal('section_id is missing');
				done();
			})
        });
    });

	it('should get e of cmsc161 uv-2L of 2010-43168', function (done) {
		api.post('/instructor/login')
		.send({username : 'mamkat', password : '12345'})
		.expect(200)
		.end(function (err, res) {
			api.get('/section/getStudentsWithFiles?section_id=CMSC 161 UV-2L&order=date&student_number=2010-43168&exer_number=1')
			.set('cookie', res.headers['set-cookie'])
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);

				res.body.should.be.an('array');
				res.body[0].should.have.keys('_id', 'first_name', 'last_name', 'files');

				res.body[0]._id.should.be.string;
				res.body[0]._id.should.be.equal('2010-43168');

				res.body[0].files.should.be.an('array');
				res.body[0].files[0].should.have.keys('name', 'size', 'date', 'version', 'path');
				res.body[0].files[0].name.should.match(/exer1/gi);
				done();
			})
        });
    });
});
