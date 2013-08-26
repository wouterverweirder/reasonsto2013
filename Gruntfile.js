/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    compass: {
      dist: {
        options: {
          sassDir: 'public-dev/css',
          cssDir: 'public/css',
          environment: 'production'
        }
      },
      shower: {
        options: {
          sassDir: 'public-dev/shower/themes/ribbon/styles',
          cssDir: 'public-dev/shower/themes/ribbon/styles',
          environment: 'production'
        }
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      client: {
        src: [
          'public-dev/js/lib/jquery.js',
          'public-dev/js/lib/socket.io.js',
          'public-dev/js/client.js'
        ],
        dest: 'public-dev/js/client-concat.js'
      },
      presentation: {
        src: [
          'public-dev/js/lib/jquery.js',
          'public-dev/js/lib/socket.io.js',
          'public-dev/shower/shower.js',
          'public-dev/js/presentation.js'
        ],
        dest: 'public-dev/js/presentation-concat.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      client: {
        src: '<%= concat.client.dest %>',
        dest: 'public/js/client.min.js'
      },
      presentation: {
        src: '<%= concat.presentation.dest %>',
        dest: 'public/js/presentation.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: 'vars',
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          $: true,
          _: true,
          Backbone: true
        },
        ignores: ['public-dev/js/lib/*.js']
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    copy: {
      main: {
        expand: true,
        cwd: 'public-dev/',
        src: ['*.html', 'shower/**'],
        dest: 'public/',
      },
      slides: {
        expand: true,
        cwd: 'public-dev/',
        src: ['slides/**'],
        dest: 'public/',
      },
      fonts: {
        expand: true,
        cwd: 'public-dev/',
        src: ['fonts/**'],
        dest: 'public/',
      }
    },
    watch: {
      clientJs: {
        files: ['public-dev/js/client.js'],
        tasks: ['jshint', 'concat:client', 'uglify:client'],
        spawn: false
      },
      presentationJs: {
        files: ['public-dev/js/presentation.js'],
        tasks: ['jshint', 'concat:presentation', 'uglify:presentation'],
        spawn: false
      },
      css: {
        files: ['public-dev/css/*'],
        tasks: ['compass'],
        spawn: false
      },
      html: {
        files: ['public-dev/*.html'],
        tasks: ['copy'],
        spawn: false
      },
      slides: {
        files: ['public-dev/slides/*'],
        tasks: ['copy:slides'],
        spawn: false
      },
      fonts: {
        files: ['public-dev/fonts/*'],
        tasks: ['copy:fonts'],
        spawn: false
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task.
  grunt.registerTask('default', ['compass:dist', 'compass:shower', 'jshint', 'concat:client', 'uglify:client', 'concat:presentation', 'uglify:presentation', 'copy:main', 'copy:slides', 'copy:fonts']);

};
