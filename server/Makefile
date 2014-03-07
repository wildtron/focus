TESTS = test/*.js
test:
	npm install
	npm start
	mocha --timeout 5000 --reporter spec $(TESTS)

.PHONY: test