module.exports = function(grunt) {
   grunt.initConfig({
      concat: {
         options: { separator: ';\r\n\r\n' },
         behaviors: {
            src: [
               'source/behaviors.js'
            ],
            dest: 'builds/behaviors.js'
         },
         interactionLib: {
            src: [
               'source/behaviors.js',
               'source/extensions/*.js',
               'source/behaviors/*.js'
            ],
            dest: 'builds/interaction-lib.js'
         }
      },
      uglify: {
         behaviors: { src: 'builds/behaviors.js', dest: 'builds/behaviors.min.js' },
         interactionLib: { src: 'builds/interaction-lib.js', dest: 'builds/interaction-lib.min.js' }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.registerTask('build-all', ['concat', 'uglify']);
};
