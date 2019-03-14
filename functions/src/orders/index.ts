import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { readFileSync } from 'fs';
import { join } from 'path';

import { IOrder } from '../definitions';

const Lob = require('lob')(functions.config().keys.lob);

const POSTCARD_FRONT: string = readFileSync(join(__dirname, '../../', 'templates', 'front.html'), 'utf8');
const POSTCARD_BACK: string = readFileSync(join(__dirname, '../../', 'templates', 'back.html'), 'utf8');

export const ordersOnCreate = functions.firestore.document('orders/{orderId}').onCreate((snapshot, context) => {
  const order: IOrder = snapshot.data() as IOrder;
  
  // Let's send the order to Lob for printing!
  return new Promise((res, rej) => {
    Lob.postcards.create({
      description: `Typeform 💌 Lob - ${order.token}`,
      to: {
        name: order.recipient.name,
        address_line1: order.recipient.address,
        address_line2: '',
        address_city: order.recipient.city,
        address_state: order.recipient.state,
        address_zip: order.recipient.zip
      },
      from: {
        name: order.sender.name,
        address_line1: order.sender.address,
        address_line2: '',
        address_city: order.sender.city,
        address_state: order.sender.state,
        address_zip: order.sender.zip
      },
      front: POSTCARD_FRONT,
      back: POSTCARD_BACK,
      merge_variables: {
        image: order.image,
        message: order.message
      }
    }, (error: any, success: any) => {
      if (error) {
        rej(error);
      } else {
        delete success.from;
        delete success.to;
        res(success);
      }
    });
  })
  // If successful we will update the order status accordingly
  .then((sent) => admin.firestore().collection('status').doc(order.token).update({
    error: false,
    message: 'Your order has been successfully sent to Lob',
    completed: true,
    lastUpdated: new Date(),
    sent
  }))
  // If we are unable to send the order to Lob we will update our status with an error
  .catch(() => admin.firestore().collection('status').doc(order.token).update({
    error: true,
    message: 'Your order could not be sent to Lob',
    lastUpdated: new Date()
  }));
});