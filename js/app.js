'use strict';
$(window).on("load resize", (ev) => {
  if (960 < window.innerWidth) {
    $('body').addClass("show-side-nav");
  } else {
    $('body').removeClass("show-side-nav");
  }
})

function closeSidebar() {
  window.history.back();
  $('body').removeClass("show-side-panel");
}

var KelbyOne = KelbyOne || {
  host: 'https://kelbynew.staging.wpengine.com',
  namespace: 'wp-json/ko/v2',
  data: {
    categories: [],
    courses: [],
    course: {}
  },
  hasAuth: function () {
    return getCookie('_ko-session_token');
  },
  retrieveCategories: function () {
    var url = KelbyOne.host + '/' + KelbyOne.namespace + '/categories';
    var $template = $("#category-list-template").html();
    return this.load('categories', url, $template, '#nav');
  },
  retrieveCourses: function (category = null) {
    if (960 > window.innerWidth) {
      $('body').removeClass("show-side-nav");
    }
    $('body').removeClass("show-side-panel");
    var url = KelbyOne.host + '/' + KelbyOne.namespace + '/courses?per_page=12';
    if (category) {
      url = KelbyOne.host + '/' + KelbyOne.namespace + '/categories/' + category + '/courses?per_page=12';
    }
    var $template = $("#course-list-template").html();
    return this.load('courses', url, $template, '#list');
  },
  viewCourse: function (course = null) {
    if (!course) {
      return;
    }
    if (960 > window.innerWidth) {
      $('body').removeClass("show-side-nav");
    }
    $('body').addClass("show-side-panel");
    var url = KelbyOne.host + '/' + KelbyOne.namespace + '/courses/' + course;
    var $template = $("#course-detail-template").html();
    return this.load('course', url, $template, '#item');
  },
  authorize: function (data, resource) {
    var url = KelbyOne.host + '/' + KelbyOne.namespace + '/users/' + resource;

    $.ajax({
      type: "GET",
      url: url,
      contentType: 'application/json',
      beforeSend: function (request) {
        // lock the form to avoid multiple submit
        $('#login').find('input').attr('disabled', true);
        $('#login').find('input[type="submit"]').val('Loading...');
        request.setRequestHeader("Authorization", "Basic " + btoa(data.username + ":" + data.password));
      },
      success: function (response) {
        setCookie('_ko-session_token', response.data.token);
        KelbyOne.loadDynamic();
        return KelbyOne.hideLoginForm();
      },
      error: function (response) {
        console.error(response, 'error')
        $('#error').html(response.responseJSON.data);
      }
    }).done(function () {
      $('#login').find('input').attr('disabled', false);
      $('#login').find('input[type="submit"]').val('Submit');
    });
  },
  bindLoginSubmit: function () {
    var self = this;
    $('#login').on('submit', function (ev) {
      ev.preventDefault();
      var data = normalizeFormData($('#login').serializeArray());
      self.authorize(data, 'login');
    });
  },
  showLoginForm: function () {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    $('body').addClass('show-overlay');
    this.bindLoginSubmit();
  },
  hideLoginForm: function () {
    $('body').removeClass('show-overlay');
  },
  load: function (resource, url, $template, target) {
    if (!KelbyOne.hasAuth()) {
      return KelbyOne.showLoginForm();
    }
    var self = this;

    $.ajax({
      type: "GET",
      url: url,
      contentType: 'application/json',
      beforeSend: function () {
        // Clear existing
        $('.active').removeClass('active');
        $(target).addClass('loading').empty();
      },
      success: function (response) {
        self.data[resource] = response.data;
        if ('course' === resource) {
          // get and append lesson data
          url = KelbyOne.host + '/' + KelbyOne.namespace + '/courses/' + response.data.id + '/lessons';
          $.ajax({
            type: "GET",
            url: url,
            contentType: 'application/json',
            success: function (response) {
              self.data[resource]['lessons'] = response.data;
              var template = Handlebars.compile($template);

              $(target).removeClass('loading');
              $(target).html(template(self.data));
            }
          })
        } else {
          var template = Handlebars.compile($template);

          $(target).removeClass('loading');
          $(target).html(template(self.data));
        }
      }
    }).done(function () {
      $('#nav a').each(function () {
        var $this = $(this);
        // if the current path is like this link, make it active
        if (location.hash && $this.attr('href') == location.hash) {
          $this.parents('.item').addClass('active');
        }
      })
    });
  },
  loadDynamic: function () {
    if (!KelbyOne.hasAuth()) {
      return KelbyOne.showLoginForm();
    }
    var hash = window.location.hash;
    var parts = hash.split('/');

    if ('#category' === parts[0]) {
      return KelbyOne.retrieveCourses(parts[1]);
    }

    if ('#course' === parts[0]) {
      return KelbyOne.viewCourse(parts[1]);
    }

    return KelbyOne.retrieveCourses();
  }
}

KelbyOne.retrieveCategories();
window.onload = KelbyOne.loadDynamic;
window.onhashchange = KelbyOne.loadDynamic;

/*
      Helper Functions.
**************************************/
function normalizeFormData(data) {
  var normalized = data.reduce(function (obj, item) {
    obj[item.name] = item.value;
    return obj;
  }, {});
  return normalized;
}

function setCookie(key, value) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}

function removeCookie(key) {
  KelbyOne.showLoginForm();
  console.log(key, $.cookie(key));
  if ($.cookie(key) === undefined) {
    return false;
  }
  // Must not alter options, thus extending a fresh object...
  $.cookie(key, '', $.extend({}, {}, {
    expires: -1
  }));
  return !$.cookie(key);
}

function toggleSidebar() {
  $('body').toggleClass("show-side-panel");
}

function toggleSidenav() {
  $('body').toggleClass("show-side-nav");
}

// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker
//     .register('./service-worker.js')
//     .then(function () {
//       console.log('Service Worker Registered');
//     });
// }