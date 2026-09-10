/* ==========================================================================
   Phivae launch page
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     LAUNCH TIME — edit this one line to move the countdown.
     ISO 8601 with a timezone. The Z suffix means UTC; Uganda is UTC+3, so
     17:00Z below is 20:00 in Kampala.
     ------------------------------------------------------------------------ */
  var LAUNCH_AT = '2026-09-11T17:00:00Z';

  var target = new Date(LAUNCH_AT).getTime();

  var el = {
    wrap: document.getElementById('countdown'),
    hours: document.getElementById('cd-h'),
    minutes: document.getElementById('cd-m'),
    seconds: document.getElementById('cd-s'),
    announce: document.getElementById('cd-announce'),
    label: document.querySelector('.cd-label')
  };

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function tick() {
    var remaining = target - Date.now();

    if (remaining <= 0) {
      el.hours.textContent = '00';
      el.minutes.textContent = '00';
      el.seconds.textContent = '00';
      el.wrap.setAttribute('data-done', 'true');
      if (el.label) el.label.textContent = 'The doors are open';
      if (el.announce) el.announce.textContent = 'The doors are open.';
      return false;
    }

    var totalSeconds = Math.floor(remaining / 1000);
    el.hours.textContent = pad(Math.floor(totalSeconds / 3600));
    el.minutes.textContent = pad(Math.floor(totalSeconds / 60) % 60);
    el.seconds.textContent = pad(totalSeconds % 60);
    return true;
  }

  if (el.wrap && !isNaN(target)) {
    var running = tick();

    if (running) {
      var timer = setInterval(function () {
        if (!tick()) clearInterval(timer);
      }, 1000);

      // Screen readers hear the remaining time once, not sixty times a minute.
      if (el.announce) {
        el.announce.textContent = el.hours.textContent + ' hours, ' +
          el.minutes.textContent + ' minutes until the site opens.';
      }
    }
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- Signup ---------------------------------------------------------------
     One field. Every extra field costs signups, and an address is all that is
     needed to tell someone the site is live. */

  var form = document.getElementById('signup');
  if (!form) return;

  var note = document.getElementById('signup-note');
  var submit = document.getElementById('signup-submit');
  var email = document.getElementById('email');

  function say(message, state) {
    note.textContent = message;
    note.setAttribute('data-state', state || '');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var value = email.value.trim();
    var valid = Boolean(value) && email.checkValidity();
    email.setAttribute('aria-invalid', valid ? 'false' : 'true');

    if (!valid) {
      say('That email address doesn’t look right.', 'error');
      email.focus();
      return;
    }

    submit.disabled = true;
    say('Adding you…', '');

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value })
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body.success) {
          form.reset();
          email.setAttribute('aria-invalid', 'false');
          say('You’re on the list. We’ll email you the minute it opens.', 'ok');
        } else {
          say(result.body.error || 'That didn’t go through. Try again.', 'error');
        }
      })
      .catch(function () {
        say('Network problem. Try again in a moment.', 'error');
      })
      .then(function () {
        submit.disabled = false;
      });
  });
})();
