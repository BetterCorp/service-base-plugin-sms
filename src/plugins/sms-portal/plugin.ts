import { IPlugin, PluginFeature } from '@bettercorp/service-base/lib/ILib';
import { Tools } from '@bettercorp/tools/lib/Tools';
import moment = require('moment');
import { ISMSPortalEvents } from '../../events';
import { ICredentials, ISMSData, webRequest as CWR } from '../../lib';

interface ISession {
  username: string;
  expires: number;
  token: string;
  timeout: any;
}
export class Plugin implements IPlugin {
  private SESSIONS: Array<ISession> = [];

  private authenticate (creds: ICredentials) {
    const self = this;
    return new Promise((resolve, reject) => {
      const nowActive = new Date().getTime();
      for (let sess of self.SESSIONS) {
        if (sess.username === creds.username) {
          if (sess.expires > nowActive) {
            console.log(`[SMS] AUTH: PRE OKAY: ${sess.username} until ${moment(sess.expires).format('DD/MM/YYYY HH:mm:ss')}`);
            return resolve(sess.token);
          }
        }
      }
      console.log(`[SMS] AUTH: ${creds.username}`);
      CWR('/Authentication',
        'GET',
        undefined,
        undefined,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: creds.username,
            password: creds.password
          },
        }).then((x: any) => {
          console.log(`[SMS] AUTH: OKAY: ${creds.username}`);
          const timeoutMiliSec = new Date().getTime() + (x.data.expiresInMinutes * 60 * 1000);
          let newSession: ISession = {
            username: creds.username,
            token: x.data.token,
            expires: timeoutMiliSec,
            timeout: setTimeout(() => {
              for (let i = 0; i < self.SESSIONS.length; i++) {
                if (self.SESSIONS[i].token === x.data.token) {
                  console.log(`[SMS] AUTH: CLEARED EXPIRED TOKEN: ${creds.username}`);
                  self.SESSIONS.splice(i, 1);
                }
              }
            }, timeoutMiliSec + 1000)
          };
          self.SESSIONS.push(newSession);
          resolve(x.data.token);
        }).catch(reject);
    });
  }

  init (features: PluginFeature): Promise<void> {
    const self = this;
    return new Promise((resolve) => {
      features.onReturnableEvent(null, ISMSPortalEvents.SendSMS, async (resolve: Function, reject: Function, data: ISMSData) => {
        if (Tools.isNullOrUndefined(data) || Tools.isNullOrUndefined(data.server) || Tools.isNullOrUndefined(data.server.username) || Tools.isNullOrUndefined(data.server.password)) {
          return reject('Undefined variables passed in!');
        }

        const authToken = await self.authenticate(data.server);
        CWR('/bulkmessages',
          'POST',
          undefined,
          {
            Messages: data.data
          },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then(x => {
            resolve(x);
          }).catch(x => {
            reject(x);
          });
      });

      features.log.info("SMS Portal Ready");
      resolve();
    });
  };
};