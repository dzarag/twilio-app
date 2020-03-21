const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: false }));

const shoppingItems = [];

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

  twiml.redirect('/order-item');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/repeat-order-item', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/order-item',
    language: 'de-DE',
  });

  gather.say(
    'Ich habe sie leider nicht verstanden, können Sie es bitte nochmal wiederholen?',
    { language: 'de-DE' }
  );
  // If the user doesn't enter input, loop
  twiml.redirect('/repeat-order-item');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/order-item', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'dtmf speech',
    timeout: 5,
    action: '/confirm-item',
    language: 'de-DE',
  });

  gather.say(
    `Sie können nun gerne Ihre Bestellung aufgeben. Nach der Nennung eines Produktes drücken Sie bitte die 1 – und wir bestätigen, ob wir Sie richtig verstanden haben. Falls Sie Hilfe benötigen, drücken Sie bitte die 2.`,
    {
      language: 'de-DE',
    }
  );

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/add-another-item', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'dtmf speech',
    timeout: 5,
    action: '/confirm-item',
    language: 'de-DE',
  });

  gather.say(`Nehnen Sie bitt Ihre nächstes Produkt`, {
    language: 'de-DE',
  });

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/confirm-item', (request, response) => {
  const twiml = new VoiceResponse();

  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '1':
        if (!request.body.SpeechResult) {
          twiml.redirect('/repeat-order-item');
        } else {
          shoppingItems.push(request.body.SpeechResult.toLowerCase());
          twiml.say(`${request.body.SpeechResult} an Ihre Liste hinzugefügt.`, {
            language: 'de-DE',
          });
          twiml.redirect('/add-another-item');
        }
        break;
      case '2':
        twiml.say('Wie können wir Ihnen helfen', {
          language: 'de-DE',
        });
        break;
      case '0':
        twiml.say(`Vielen Dank für Ihre Bestellung.`, {
          language: 'de-DE',
        });
        break;
      default:
        twiml.redirect('/repeat-order-item');
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect('/repeat-order-item');
  }

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
