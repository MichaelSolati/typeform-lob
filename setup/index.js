const { createClient } = require('@typeform/api-client');
const fs = require('fs');
const join = require('path').join;
const prompts = require('prompts');

const { to } = require('./to');
const { processPromise } = require('./process-promise');
const { requestPromise } = require('./request-promise');

const start = async () => {
  const WEBHOOK_TAG = 'typeform-lob';

  const READY_CONFIGURED = (await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Before we get started, do you have a Firebase project with Cloud Functions, Hosting, and Cloud Firestore enabled?'
  })).value;
  
  if (!READY_CONFIGURED) {
    return console.error('We can\'t continue until you set up a Firebase project with Cloud Functions, Hosting, and Cloud Firestore enabled!')
  }

  const READY_INSTALLED = (await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Also, do you have the Firebase CLI installed, and are you signed in?'
  })).value;
  
  if (!READY_INSTALLED) {
    return console.error('We can\'t continue until you set up the Firebase CLI!')
  }

  const FIREBASE = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is your Firebase Project ID?',
    validate: value => value.length < 1 ? 'I think your Project ID should be longer than that' : true
  })).value;

  if (!FIREBASE) {
    return;
  }

  const FIREBASE_API = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is your Firebase API Key? (You can get this from the web config details)',
    validate: value => value.length < 10 ? 'I think your API Key should be longer than that' : true
  })).value;

  if (!FIREBASE_API) {
    return;
  }

  const TYPEFORM = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is your Personal Token from Typeform? (We will need read/write access to your forms and webhooks) \n' +
    'You can create one here => https://admin.typeform.com/account#/section/tokens \n',
    validate: value => value.length < 4 ? 'I think your Personal Token should be longer than that' : true
  })).value;

  if (!TYPEFORM) {
    return;
  }
  
  const LOB = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is your Lob Secret API Key? \n' +
    'For the sake of testing we advise using your Test Environment \n' +
    'You can get your LOB key from => https://dashboard.lob.com/#/settings/keys \n',
    validate: value => value.length < 10 ? 'I think your API Key should be longer than that' : true
  })).value;

  if (!LOB) {
    return;
  }

  const MAILGUN = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is your Mailgun Private API Key? (This is used to send email updates on orders) \n' +
    'You can get yours here => https://app.mailgun.com/app/account/security/api_keys \n',
    validate: value => value.length < 4 ? 'I think your API Key should be longer than that' : true
  })).value;

  if (!MAILGUN) {
    return;
  }

  const MAILGUN_URL = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What is the Domain for your Mailgun messages? \n' +
    'You can get yours here => https://app.mailgun.com/app/messages/domains \n',
    validate: value => value.length < 4 ? 'I think your domain should be longer than that' : true
  })).value;

  if (!MAILGUN_URL) {
    return;
  }

  const FROM_EMAIL = (await prompts({
    type: 'text',
    name: 'value',
    message: 'What email address should the confirmation emails come from?',
    validate: value => value.length < 4 ? 'I think your return email should be longer than that' : true
  })).value;

  if (!FROM_EMAIL) {
    return;
  }

  console.log('Attempting to create Typeform form');
  const [typeformError, typeformSuccess] = await to(requestPromise({
    method: 'POST',
    url: 'https://api.typeform.com/forms',
    headers: {
      Authorization: 'Bearer ' + TYPEFORM,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(require('./templates/form.json'))
  }));
  
  if (typeformError) {
    return console.error('ERROR - We couldn\'t create the form, are you sure you provided us the right Typeform Personal Token?');
  }

  console.log('Attempting to configure webhook on Typeform submission');
  const [webhookCreateError] = await to(createClient({ token: TYPEFORM }).webhooks.create({
    uid: typeformSuccess.id,
    tag: WEBHOOK_TAG,
    url: 'https://us-central1-' + FIREBASE + '.cloudfunctions.net/api/webhook',
    enable: true
  }));

  if (webhookCreateError) {
    return console.error('ERROR - We couldn\'t create a webhook on Typeform, are you sure you provided us the right Typeform Personal Token?');
  }

  console.log('Configuring local Firebase project');
  const firebaserc = { projects: { default: FIREBASE } };
  fs.writeFileSync(join(__dirname, '../', '.firebaserc'), JSON.stringify(firebaserc), { encoding: 'utf8' });

  console.log('Creating landing page to view form');
  const indexHTML = fs.readFileSync(join(__dirname, 'templates', 'index.html'), { encoding: 'utf8' })
    .replace(/{{TYPEFORM_URL}}/g, typeformSuccess._links.display);
  fs.writeFileSync(join(__dirname, '../', 'public', 'index.html'), indexHTML, { encoding: 'utf8' });

  console.log('Creating order page to view orders');
  const orderHTML = fs.readFileSync(join(__dirname, 'templates', 'order.html'), { encoding: 'utf8' })
    .replace(/{{FIREBASE}}/g, FIREBASE)
    .replace(/{{FIREBASE_API}}/g, FIREBASE_API);
  fs.writeFileSync(join(__dirname, '../', 'public', 'order.html'), orderHTML, { encoding: 'utf8' });

  console.log('Attempting to set Firebase Cloud Function Environment Keys');
  const [functionsConfigError] = await to(processPromise(`npx firebase-tools functions:config:set keys.lob="${LOB}" keys.projectid="${FIREBASE}" keys.mailgun="${MAILGUN}" keys.mailgunurl="${MAILGUN_URL}" keys.from="${FROM_EMAIL}"`));
  if (functionsConfigError) {
    return console.error('ERROR - We couldn\'t create a set your Lob Key as a Firebase Cloud Function Environment Key, try again later');
  }

  console.log('Attempting to deploy your application to Firebase');
  const [functionsDeployError] = await to(processPromise('npx firebase-tools deploy --non-interactive'));
  if (functionsDeployError) {
    return console.error('ERROR - We couldn\'t deploy "Typeform 💌 Lob" to Firebase, try again later');
  }

  console.log('Congratulations, everything went swimmingly! You can view your app at: https://' + FIREBASE + '.firebaseapp.com');
}

start();