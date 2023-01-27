import {
  ServicesClient,
  ServiceCallable,
  ServicesBase,
} from "@bettercorp/service-base";
import {
  IMessage,
  SMSPortalReturnableEvents,
  SMSResponse,
} from "../../plugins/service-sms-portal/plugin";
import { MyPluginConfig } from "../../plugins/service-sms-portal/sec.config";
import { Tools } from "@bettercorp/tools";

export class smsPortalClient extends ServicesClient<
  ServiceCallable,
  ServiceCallable,
  SMSPortalReturnableEvents,
  ServiceCallable,
  ServiceCallable,
  MyPluginConfig
> {
  public readonly _pluginName: string = "service-sms-portal";
  private apiKey?: string;
  private apiSecret?: string;
  constructor(self: ServicesBase);
  constructor(self: ServicesBase, apiKey: string, apiSecret: string);
  constructor(self: ServicesBase, apiKey?: string, apiSecret?: string) {
    super(self);
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  public async sendSMS(message: IMessage): Promise<SMSResponse>;
  public async sendSMS(
    message: IMessage,
    apiKey: string,
    apiSecret: string
  ): Promise<SMSResponse>;
  public async sendSMS(
    message: IMessage,
    apiKey?: string,
    apiSecret?: string
  ): Promise<SMSResponse> {
    const workingKey = apiKey ?? this.apiKey;
    const workingSecret = apiSecret ?? this.apiSecret;
    if (!Tools.isString(workingKey)) throw "Need a valid API Key";
    if (!Tools.isString(workingSecret)) throw "Need a valid API Secret";
    return await this._plugin.emitEventAndReturn(
      "sendSMS",
      workingKey,
      workingSecret,
      [message]
    );
  }
  public async sendSMSs(messages: Array<IMessage>): Promise<SMSResponse>;
  public async sendSMSs(
    messages: Array<IMessage>,
    apiKey: string,
    apiSecret: string
  ): Promise<SMSResponse>;
  public async sendSMSs(
    messages: Array<IMessage>,
    apiKey?: string,
    apiSecret?: string
  ): Promise<SMSResponse> {
    const workingKey = apiKey ?? this.apiKey;
    const workingSecret = apiSecret ?? this.apiSecret;
    if (!Tools.isString(workingKey)) throw "Need a valid API Key";
    if (!Tools.isString(workingSecret)) throw "Need a valid API Secret";
    return await this._plugin.emitEventAndReturn(
      "sendSMS",
      workingKey,
      workingSecret,
      messages
    );
  }
}
