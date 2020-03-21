const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: false }));

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
app.post('/voice', (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/name',
    language: 'de-DE',
  });
  gather.say(
    'Willkommen bei "Essen für alle". Wir helfen Ihnen dabei, jemand zu finden, der für Sie einkauft, wenn sie selbst nicht dazu in der Lage sind. Wenn sich innerhalb von 30 Minuten nach Aufgabe Ihrer Bestellung niemand bei Ihnen meldet, melden wir uns persönlich bei Ihnen. Um zu Beginnen, nennen Sie uns bitte Ihren Namen:',
    { language: 'de-DE' }
  );

  // If the user doesn't enter input, loop
  twiml.redirect('/repeat-name');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/repeat-name', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/name',
    language: 'de-DE',
  });

  gather.say(
    'Ich habe sie leider nicht verstanden, können Sie es bitte nochmal wiederholen?',
    { language: 'de-DE' }
  );
  // If the user doesn't enter input, loop
  twiml.redirect('/repeat-name');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

// Create a route that will handle <Gather> input
app.post('/name', (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  if (!request.body.SpeechResult) {
    twiml.redirect('/repeat-name');
  } else {
    twiml.say(
      `Willkommen bei "Essen für alle", ${request.body.SpeechResult}.`,
      { language: 'de-DE' }
    );
    twiml.pause();
    const gather = twiml.gather({
      input: 'speech',
      timeout: 5,
      action: '/address',
      language: 'de-DE',
    });
    gather.say('Wie lautet die Adresse, an die wir liefern sollen?', {
      language: 'de-DE',
    });
  }

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/repeat-address', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/address',
    language: 'de-DE',
  });

  gather.say(
    'Ich habe sie leider nicht verstanden, können Sie es bitte nochmal wiederholen?',
    { language: 'de-DE' }
  );
  // If the user doesn't enter input, loop
  twiml.redirect('/repeat-address');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/address', (request, response) => {
  const twiml = new VoiceResponse();

  if (!request.body.SpeechResult) {
    twiml.redirect('/repeat-address');
  } else {
    twiml.say(`Ok, wir werden an ${request.body.SpeechResult} liefern.`, {
      language: 'de-DE',
    });
    twiml.pause();
    twiml.say('Vielen Dank', {
      language: 'de-DE',
    });
    twiml.pause({ length: 2 });
    twiml.say(
      'Für Rückfragen speichern wir Ihre Telefonnummer, bis wir Ihnen Ihre Bestellung übergeben haben.',
      {
        language: 'de-DE',
      }
    );
  }
  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
