const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: false }));

const orderObject = {
  name: '',
  address: '',
  shoppingItems: [],
  phoneNumber: '',
};

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
app.post('/voice', (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  orderObject.phoneNumber = request.body.From.toString();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/name',
    language: 'de-DE',
  });
  gather.say(
    'Willkommen bei "Karotten für Marie". Wir helfen Ihnen dabei, jemand zu finden, der für Sie einkauft, wenn sie selbst nicht dazu in der Lage sind. Wenn sich innerhalb von 30 Minuten nach Aufgabe Ihrer Bestellung niemand bei Ihnen meldet, melden wir uns persönlich bei Ihnen. Um zu Beginnen, nennen Sie uns bitte Ihren Namen:',
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
    orderObject.name = request.body.SpeechResult;
    twiml.say(
      `Willkommen bei "Karotten für Marie", ${request.body.SpeechResult}.`,
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
    orderObject.address = request.body.SpeechResult;
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

  twiml.say(`Sie können nun gerne Ihre Bestellung aufgeben.`, {
    language: 'de-DE',
  });

  twiml.redirect('/add-item');

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/add-item', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    action: '/confirm-item',
    language: 'de-DE',
  });

  gather.say(`Nehnen Sie bitte Ihre nächstes Artikel`, {
    language: 'de-DE',
  });

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/confirm-item', (request, response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    timeout: 5,
    action: '/save-item',
    language: 'de-DE',
  });

  if (request.body.SpeechResult) {
    orderObject.shoppingItems.push(request.body.SpeechResult);

    gather.say(
      `Sie haben ${request.body.SpeechResult} gesagt. Zum bestätigen drücken Sie bitte die 1.`,
      {
        language: 'de-DE',
      }
    );
  }

  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '0':
        twiml.say(
          `Wir haben folgende Artikeln an Ihre Shop Liste hinzugefügt: ${orderObject.shoppingItems.toString()}`,
          {
            language: 'de-DE',
          }
        );
        twiml.pause();
        twiml.say('Vielen Dank für Ihre bestellung.', {
          language: 'de-DE',
        });
        twiml.hangup();
        axios
          .post(`${process.env.WEBAPP_URL}/upload`, orderObject)
          .then(function(response) {
            orderObject.name = '';
            orderObject.address = '';
            orderObject.phoneNumber = '';
            orderObject.shoppingItems = [];
          })
          .catch(function(error) {
            orderObject.name = '';
            orderObject.address = '';
            orderObject.phoneNumber = '';
            orderObject.shoppingItems = [];
            console.log(error);
          });
      default:
        twiml.redirect('/add-item');
        break;
    }
  }

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('repeat-confirm-item', (request, response) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    timeout: 5,
    action: '/save-item',
    language: 'de-DE',
  });
  gather.say('Bitte, drücken sie die 1 um zu bestätigen', {
    language: 'de-DE',
  });

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/save-item', (request, response) => {
  const twiml = new VoiceResponse();

  // If the user entered digits, process their request
  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '1':
        const gather = twiml.gather({
          input: 'dtmf speech',
          numDigits: 1,
          timeout: 5,
          action: '/confirm-item',
          language: 'de-DE',
        });
        gather.say(
          `Ihre Bestell Artikel ${
            orderObject.shoppingItems.slice(-1)[0]
          } würde an Ihre Liste hinzugefügt. Bitte, nehnen sie ein weiteres Produkt, oder drücken sie die 0 um ihre Bestellung zu beenden`,
          {
            language: 'de-DE',
          }
        );
        break;
      default:
        twiml.redirect('/repeat-confirm-item');
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect('/repeat-confirm-item');
  }

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
