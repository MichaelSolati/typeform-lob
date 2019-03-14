import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';

admin.initializeApp();

import { webhook } from './webhook';

const app = express();
app.post('/webhook', webhook);
export const api = functions.https.onRequest(app);

export * from './orders';
export * from './status';