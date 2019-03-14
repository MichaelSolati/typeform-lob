import { IOrder, IResponse } from './definitions';

export const parseOrder = (response: IResponse): IOrder => {
  // @ts-ignore
  const order: IOrder = {
    timestamp: new Date(response.submitted_at),
    token: response.token,
    // @ts-ignore
    sender: {},
    // @ts-ignore
    recipient: {},
    image: 'https://raw.githubusercontent.com/MichaelSolati/typeform-lob/master/setup/assets/typeform.jpg'
  };

  response.answers.forEach((answer: any) => {
    const ref = answer['field']['ref'];
    switch (ref) {
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
        order['sender']['zip'] = answer.text;
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

  return order;
}