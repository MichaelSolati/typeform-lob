import * as express from 'express';
import * as admin from 'firebase-admin';

import { IOrder, IWebhook } from '../definitions';

export const webhook = async (request: express.Request, response: express.Response) => {
  const submission: IWebhook = request.body;
  // This is our initial order, we will fill it out as we continue...
  // @ts-ignore
  const order: IOrder = {
    timestamp: new Date(submission.form_response.submitted_at),
    token: submission.form_response.token,
    // @ts-ignore
    sender: {},
    // @ts-ignore
    recipient: {},
    image: 'https://raw.githubusercontent.com/MichaelSolati/typeform-lob/master/setup/assets/typeform.jpg'
  };

  // Here we parse out details from the form submission
  submission.form_response.answers.forEach((answer: any) => {
    const ref = answer['field']['ref'];
    switch (ref) {
      case 'sender-email':
        order['sender']['email'] = answer.email;
      case 'sender-name':
        order['sender']['name'] = answer.text;
        break;
      case 'sender-address':
        order['sender']['address'] = answer.text;
        break;
      case 'sender-city':
        order['sender']['city'] = answer.text;
        break;
      case 'sender-state':
        order['sender']['state'] = answer.text || answer.choice.label;
        break;
      case 'sender-zip':
        order['sender']['zip'] = answer.text;
        break;
      case 'recipient-name':
        order['recipient']['name'] = answer.text;
        break;
      case 'recipient-address':
        order['recipient']['address'] = answer.text;
        break;
      case 'recipient-city':
        order['recipient']['city'] = answer.text;
        break;
      case 'recipient-state':
        order['recipient']['state'] = answer.text || answer.choice.label;
        break;
      case 'recipient-zip':
        order['recipient']['zip'] = answer.text;
        break;
      case 'message-text':
        order['message'] = answer.text;
        break;
      case 'message-image':
        order['image'] = answer.text || order.image;
        break;
      default:
        break;
    }
  });
  
  // We will now save the order into a collection for our reference
  return admin.firestore().collection('orders').doc(order.token).set(order)
    // We also will create a status document to keep a sender up to date on their order
    .then(() => admin.firestore().collection('status').doc(order.token).set({
      lastUpdated: new Date(),
      completed: false,
      error: false,
      message: 'Order to be sent to printer',
      email: order.sender.email,
      name: order.sender.name
    }))
    .then(() => response.status(200).send({ success: true }));
}