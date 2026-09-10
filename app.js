/* ==========================================================================
   Phivae launch page
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     LAUNCH TIME — edit this one line to move the countdown.
     ISO 8601 with a timezone. The Z suffix means UTC; Uganda is UTC+3, so
     18:00Z below is 21:00 in Kampala.
     ------------------------------------------------------------------------ */
  var LAUNCH_AT = '2026-09-11T17:00:00Z';

  var target = new Date(LAUNCH_AT).getTime();

  var el = {
    wrap: document.getElementById('countdown'),
    hours: document.getElementById('cd-h'),
    minutes: document.getElementById('cd-m'),
    seconds: document.getElementById('cd-s'),
    announce: document.getElementById('cd-announce'),
    status: document.querySelector('.status')
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
      if (el.status) {
        el.status.lastChild.nodeValue = ' Launching now ';
      }
      if (el.announce) el.announce.textContent = 'Launching now.';
      return false;
    }

    var totalSeconds = Math.floor(remaining / 1000);
    el.hours.textContent = pad(Math.floor(totalSeconds / 3600));
    el.minutes.textContent = pad(Math.floor(totalSeconds / 60) % 60);
    el.seconds.textContent = pad(totalSeconds % 60);
    return true;
  }

  if (el.wrap && !isNaN(target)) {
    if (tick()) {
      var timer = setInterval(function () {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }

    // Screen readers get the remaining time once, not sixty times a minute.
    if (el.announce && !el.wrap.getAttribute('data-done')) {
      el.announce.textContent =
        el.hours.textContent + ' hours, ' + el.minutes.textContent +
        ' minutes until launch.';
    }
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- Signup -------------------------------------------------------------- */

  var form = document.getElementById('signup');
  if (!form) return;

  var note = document.getElementById('signup-note');
  var submit = document.getElementById('signup-submit');
  var nameField = document.getElementById('name');
  var emailField = document.getElementById('email');

  function say(message, state) {
    note.textContent = message;
    note.setAttribute('data-state', state || '');
  }

  function flag(field, invalid) {
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = nameField.value.trim();
    var email = emailField.value.trim();

    flag(nameField, !name);
    flag(emailField, !email || !emailField.checkValidity());

    if (!name) {
      say('Add your name so we know who to greet.', 'error');
      nameField.focus();
      return;
    }

    if (!email || !emailField.checkValidity()) {
      say('That email address doesn’t look right.', 'error');
      emailField.focus();
      return;
    }

    submit.disabled = true;
    say('Signing you up…', '');

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email })
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body.success) {
          form.reset();
          flag(nameField, false);
          flag(emailField, false);
          say('You’re on the list. We’ll email you at launch.', 'ok');
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
