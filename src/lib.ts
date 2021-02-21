import _AXIOS from 'axios';
const AXIOS = _AXIOS as any;
const SERVER_PATH = 'https://rest.smsportal.com/v1';

export interface ICredentials {
  username: string;
  password: string;
}

export interface IMessage {
  Content: string,
  Destination: string
}
export interface ISMSData {
  data: Array<IMessage>;
  server: ICredentials;
}

// tslint:disable-next-line: max-line-length
export function webRequest (path: string, method: string, params: Object | undefined = undefined, data: Object | undefined = undefined, additionalProps: Object | undefined = undefined) {
  return new Promise(async (resolve, reject) => {
    let newParams: Object = {};
    if (params !== undefined && params !== null) {
      newParams = params;
    }

    AXIOS({
      url: `${SERVER_PATH}${path}`,
      params: newParams,
      method,
      data,
      ...(additionalProps || {})
    }).then((x: any) =>
      additionalProps !== undefined ? resolve(x) : resolve(x.data)
    ).catch((e: any) => {
      console.error(e);
      reject(e);
    });
  });
}