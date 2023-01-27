import { SecConfig } from "@bettercorp/service-base";

export interface MyPluginConfig {}

export class Config extends SecConfig<MyPluginConfig> {
  public override migrate(
    mappedPluginName: string,
    existingConfig: MyPluginConfig
  ): MyPluginConfig {
    let newConfig: any = {};

    return newConfig;
  }
}
