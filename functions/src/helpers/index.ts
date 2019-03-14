import * as r from 'request';

interface RequestOptions {
  method: string;
  url: string;
  headers?: r.Headers;
  body?: string;
  formData?: { [key:string]: string }
}

export const request = (options: RequestOptions): Promise<any> => {
  return new Promise((res, rej) => {
    r(options, (error, response, body) => {
      if (error || response.statusCode >= 400) {
        rej(JSON.parse(body.toString()));
      }
      res(JSON.parse(body.toString()));
    });
  });
};