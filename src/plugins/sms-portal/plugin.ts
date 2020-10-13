import { IPlugin, PluginFeature } from '@bettercorp/service-base/lib/ILib';
import { Tools } from '@bettercorp/tools/lib/Tools';
import moment = require('moment');
import { ISMSPortalEvents } from '../../events';
import { ICredentials, ISMSEmitter, webRequest as CWR } from '../../lib';

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
      features.onEvent(null, ISMSPortalEvents.SendSMS, async (arg: ISMSEmitter) => {
        if (Tools.isNullOrUndefined(arg.data) || Tools.isNullOrUndefined(arg.data.server) || Tools.isNullOrUndefined(arg.data.server.username) || Tools.isNullOrUndefined(arg.data.server.password)) {
          return features.emitEvent(null, arg.resultNames.error, 'Undefined variables passed in!');
        }

        const authToken = await self.authenticate(arg.data.server);
        CWR('/bulkmessages',
          'POST',
          undefined,
          {
            Messages: arg.data.data
          },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then(x => {
            features.emitEvent(null, arg.resultNames.success, x);
          }).catch(x => {
            features.emitEvent(null, arg.resultNames.error, x);
          });
      });

      features.log.info("SMS Portal Ready");
      resolve();
    });
  };
};