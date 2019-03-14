import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const Mailgen = require('mailgen');

import { IStatus } from '../definitions';
import { request } from '../helpers';


const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Typeform 💌 Lob',
    link: `https://${functions.config().keys.projectid}.firebaseapp.com`
  }
});

const sendEmail = (status: IStatus, id: string): Promise<any> => {
  const html: string = mailGenerator.generate({
    body: {
        name: status.name || status.email,
        intro: status.message,
        action: {
          instructions: 'Click here to track your order:',
          button: {
              text: 'Track Order',
              link: `https://${functions.config().keys.projectid}.firebaseapp.com/order?id=${id}`
          }
      }
    }
  });

  return request({
    method: 'POST',
    url: `https://api.mailgun.net/v3/${functions.config().keys.mailgunurl}/messages`,
    headers: { Authorization: `Basic ${Buffer.from('api:' + functions.config().keys.mailgun).toString('base64')}` },
    formData: {
      from: functions.config().keys.from,
      to: status.email,
      subject: `Typeform 💌 Lob - Order ${id} Update`,
      text: status.message,
      html
    }
  });
}

export const statusOnCreate = functions.firestore.document('status/{statusId}').onCreate((snapshot: admin.firestore.DocumentSnapshot, context: functions.EventContext) => {
  const id: string = context.params.statusId;
  const status: IStatus = snapshot.data() as IStatus;
  return sendEmail(status, id);
});

export const statusOnUpdate = functions.firestore.document('status/{statusId}').onUpdate((change: functions.Change<admin.firestore.DocumentSnapshot>, context: functions.EventContext) => {
  if (!change.after) {
    return Promise.resolve();
  }
  const id: string = context.params.statusId;
  const status: IStatus = change.after.data() as IStatus;
  return sendEmail(status, id);
});