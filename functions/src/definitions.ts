export interface IOrder {
  timestamp: Date;
  token: string;
  sender: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }
  message: string;
  image: string;
}

export interface IWebhook {
  event_id: string;
  event_type: string;
  form_response: IResponse;
}

export interface IResponse {
  form_id: string;
  token: string;
  landed_at: string;
  submitted_at: string;
  definition: {
    id: string;
    title: string;
    fields: {
      id: string;
      title: string;
      type: string;
      ref: string;
      properties: {
        [key:string]: any
      }
    }[];
  };
  answers: {
    [key:string]: any;
    type: string;
    field: {
      id: string;
      type: string;
      ref: string;
    }
  }[];
}
