module.exports = function(grunt) {
   grunt.initConfig({
      concat: {
         options: { separator: ';\r\n\r\n' },
         site: {
            src: [
               'scripts/behaviors/*.js'
            ],
            dest: 'scripts/site.js'
         }
      },
      uglify: {
         site: { src: 'scripts/site.js', dest: 'scripts/site.min.js' }
      },
      less: {
         site: {
            compress: true,
            files: {
               'styles/site.css' : 'styles/site.less'
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-less');
   grunt.registerTask('build-all', ['concat', 'uglify', 'less']);
};
