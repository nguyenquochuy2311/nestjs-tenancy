import { DynamicModule, Global, Module } from '@nestjs/common';
import { createTeanancyProviders } from './factories';
import { ModelCtor } from 'sequelize-typescript';

@Global()
@Module({})
export class TenancyFeatureModule {
  static register(models: ModelCtor[]): DynamicModule {
    const providers = createTeanancyProviders(models);

    return {
      module: TenancyFeatureModule,
      providers,
      exports: providers,
    };
  }
}
