module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        express: {
            dev: {
                options: {
                    script: 'server.js'
                }
            }
        },
        simplemocha : {
            dev : {
                src : "test/test.js",
                options : {
                    reporter : 'spec'
                }
            }
        },
        watch : {
            all : {
                files:['**/*.js'],
                tasks:['server'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.registerTask('test', 'simplemocha:dev');
    grunt.registerTask('server', 'express:dev');

};
