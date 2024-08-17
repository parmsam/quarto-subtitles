/*
 * This file includes code derived from the Reveal.js library, which is licensed under the MIT License.
 * Portions of this code are also derived from a third-party repository built on top of Reveal.js.
 * The original author did not specify a license for these modifications, so it is assumed to fall under
 * the MIT License.
 */

window.RevealSubtitles = function () {
  var keyCodes = {
    backspace: 8, tab: 9, enter: 13, shift: 16, ctrl: 17, alt: 18, pausebreak: 19, capslock: 20,
    esc: 27, space: 32, pageup: 33, pagedown: 34, end: 35, home: 36, leftarrow: 37, uparrow: 38,
    rightarrow: 39, downarrow: 40, insert: 45, delete: 46, 0: 48, 1: 49, 2: 50, 3: 51, 4: 52,
    5: 53, 6: 54, 7: 55, 8: 56, 9: 57, a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72,
    i: 73, j: 74, k: 75, l: 76, m: 77, n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84, u: 85,
    v: 86, w: 87, x: 88, y: 89, z: 90, leftwindowkey: 91, rightwindowkey: 92, selectkey: 93,
    numpad0: 96, numpad1: 97, numpad2: 98, numpad3: 99, numpad4: 100, numpad5: 101, numpad6: 102,
    numpad7: 103, numpad8: 104, numpad9: 105, multiply: 106, add: 107, subtract: 109, decimalpoint: 110,
    divide: 111, f1: 112, f2: 113, f3: 114, f4: 115, f5: 116, f6: 117, f7: 118, f8: 119, f9: 120,
    f10: 121, f11: 122, f12: 123, numlock: 144, scrolllock: 145, semicolon: 186, equalsign: 187,
    comma: 188, dash: 189, period: 190, forwardslash: 191, graveaccent: 192, openbracket: 219,
    backslash: 220, closebracket: 221, singlequote: 222
  };
  return {
    id: "RevealSubtitles",
    init: function (deck) {
      const config = deck.getConfig();
      const options = config.subtitles || {};
      var settings = {};

      settings.toggleKey = options.toggleKey ? options.toggleKey.toLowerCase() : "t";
      settings.toggleKeyCode = keyCodes[settings.toggleKey] || 84;

      var recognition;
      var final_transcript = '';
      var start_timestamp;
      var final_text_el;
      var interim_text_el;
      var subtitle_container_el;
      var is_visible = true;

      function createHTML() {
        subtitle_container_el = document.createElement('div');
        subtitle_container_el.setAttribute('id', 'subtitles-container');

        subtitles_inner_container_el = document.createElement('div');
        subtitles_inner_container_el.setAttribute('id', 'subtitles-inner-container');

        subtitles_el = document.createElement('div');
        subtitles_el.setAttribute('id', 'subtitles');

        final_text_el = document.createElement('span');
        final_text_el.setAttribute('id', 'final_text');

        interim_text_el = document.createElement('span');
        interim_text_el.setAttribute('id', 'interim_text');

        subtitles_el.appendChild(final_text_el);
        subtitles_el.appendChild(interim_text_el);

        subtitles_inner_container_el.appendChild(subtitles_el);
        subtitle_container_el.appendChild(subtitles_inner_container_el);

        document.body.appendChild(subtitle_container_el);
      }

      function toggleVisibility() {
        is_visible = !is_visible;
        subtitle_container_el.classList.toggle('hidden');
      }

      var two_line = /\n\n/g;
      var one_line = /\n/g;
      function linebreak(s) {
        return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
      }

      var first_char = /\S/;
      function capitalize(s) {
        return s.replace(first_char, function (m) { return m.toUpperCase(); });
      }

      function setup() {
        if (!('webkitSpeechRecognition' in window)) {
          console.log('Speech recognition not supported. Use Chrome instead.');
        }
        else if (
          window.Reveal.isSpeakerNotes() === true
        ) {
          console.log("Speaker view window detected. Subtitles disabled in speaker view window.");
        } else {
          recognition = new webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onstart = function () {
            createHTML();
          };

          recognition.onerror = function (event) {
            if (event.error == 'no-speech') {
              console.log('No speech detected');
              ignore_onend = true;
            }

            if (event.error == 'audio-capture') {
              console.log('No microphone found');
              ignore_onend = true;
            }

            if (event.error == 'not-allowed') {
              if (event.timeStamp - start_timestamp < 100) {
                console.log('Permission to use microphone is blocked. Change it at chrome://settings/contentExceptions#media-stream');
              } else {
                console.log('Permission to use microphone is denied.');
              }

              ignore_onend = true;
            }
          };

          recognition.onresult = function (event) {
            var interim_transcript = '';

            for (var i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
              } else {
                interim_transcript += event.results[i][0].transcript;
              }
            }

            final_transcript = capitalize(final_transcript);
            final_text.innerHTML = linebreak(final_transcript);
            interim_text.innerHTML = linebreak(interim_transcript);
          };

          deck.addKeyBinding(
            {
              keyCode: settings.toggleKeyCode,
              key: settings.toggleKey
            },
            () =>{
              toggleVisibility();
            });
          
          
          
        }
      }

      function start() {
        recognition.start();
      }

      function stop() {
        recognition.stop();
      }

      deck.on('ready', (event) => {
        setup();
        start();

        const downloadButton = document.querySelector('.subtitles-dl-btn');
        downloadButton.addEventListener('click', function () {
          const finalTextElement = document.getElementById('final_text');
          const interimTextElement = document.getElementById('interim_text');

          const finalText = finalTextElement ? finalTextElement.innerText : '';
          const interimText = interimTextElement ? interimTextElement.innerText : '';

          const combinedText = `Final Text:\n${finalText}\n\nInterim Text:\n${interimText}`;

          const blob = new Blob([combinedText], { type: 'text/plain' });

          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'subtitles-transcript.txt';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(link.href);
        });
      });

    },
  };
};

