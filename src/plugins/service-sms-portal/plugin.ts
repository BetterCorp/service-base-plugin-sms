import {
  IPluginLogger,
  ServiceCallable,
  ServicesBase,
} from "@bettercorp/service-base";
import { MyPluginConfig } from "./sec.config";
import { Axios, AxiosResponse } from "axios";

const SMS_PORTAL_API = "https://rest.smsportal.com";

export interface IMessage {
  content: string;
  destination: string;
}

export interface SMSResponse {
  cost: number;
  remainingBalance: number;
  eventId: number;
  sample: string;
  costBreakdown: CostBreakdown[];
  messages: number;
  parts: number;
  errorReport: ErrorReport;
}

export interface CostBreakdown {
  quantity: number;
  cost: number;
  network: string;
}

export interface ErrorReport {
  noNetwork: number;
  noContents: number;
  duplicates: number;
  optedOuts: number;
  faults: any[];
}
export interface AuthToken {
  apiKey: string;
  apiSecret: string;
  token: string;
  expires: number;
}

export interface SMSPortalReturnableEvents extends ServiceCallable {
  sendSMS(
    apiKey: string,
    apiSecret: string,
    messages: Array<IMessage>
  ): Promise<SMSResponse>;
}

export class Service extends ServicesBase<
  ServiceCallable,
  ServiceCallable,
  SMSPortalReturnableEvents,
  ServiceCallable,
  ServiceCallable,
  MyPluginConfig
> {
  private axios: Axios;
  constructor(
    pluginName: string,
    cwd: string,
    pluginCwd: string,
    log: IPluginLogger
  ) {
    super(pluginName, cwd, pluginCwd, log);
    this.axios = new Axios({ baseURL: SMS_PORTAL_API });
  }
  private tokenCache: Array<AuthToken> = [];
  private async getToken(apiKey: string, apiSecret: string): Promise<string> {
    let now = new Date().getTime();
    for (let i = 0; i < this.tokenCache.length; i++) {
      const token = this.tokenCache[i];

      if (token.expires < now) {
        this.tokenCache.splice(i, 1);
        i = 0;
        continue;
      }
      if (token.apiKey === apiKey && token.apiSecret === apiSecret) {
        return token.token;
      }
    }
    let authResponse = await this.axios.get<
      any,
      AxiosResponse<{ token: string }>
    >("/authentication", {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(apiKey + ":" + apiSecret, "utf-8").toString("base64"),
      },
    });
    this.tokenCache.push({
      token: authResponse.data.token,
      apiKey,
      apiSecret,
      expires: now + 12 * 60 * 60 * 1000, // 12h
    });
    return authResponse.data.token;
  }
  override async init() {
    const self = this;
    await this.onReturnableEvent(
      "sendSMS",
      async (apiKey: string, apiSecret: string, messages: Array<IMessage>) => {
        const authToken = await self.getToken(apiKey, apiSecret);
        const messageResponse = await self.axios.post<
          any,
          AxiosResponse<SMSResponse>
        >(
          "/bulkmessages",
          JSON.stringify({
            messages: messages,
          }),
          {
            headers: {
              Authorization: authToken,
              "Content-Type": "application/json",
            },
          }
        );
        return messageResponse.data;
      }
    );
  }
}
