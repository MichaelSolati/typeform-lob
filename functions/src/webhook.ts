import * as express from 'express';
import * as functions from 'firebase-functions';
import { readFileSync } from 'fs';
import { join } from 'path';

import { parseOrder } from './parse-order';
import { IOrder, IWebhook } from './definitions';

const Lob = require('lob')(functions.config().keys.lob);

const POSTCARD_FRONT: string = readFileSync(join(__dirname, '../', 'templates', 'front.html'), 'utf8');
const POSTCARD_BACK: string = readFileSync(join(__dirname, '../', 'templates', 'back.html'), 'utf8');

export const webhook = async (request: express.Request, response: express.Response) => {
  const submission: IWebhook = request.body;
  const order: IOrder = parseOrder(submission.form_response);

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
    }, (error: any) => {
      if (error) {
        rej(error);
      } else {
        res();
      }
    });
  })
    .then(() => response.status(200).send({ success: true }))
    .catch(() => response.status(500).send({ success: false }));
}