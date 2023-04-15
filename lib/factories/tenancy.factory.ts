import { Provider } from '@nestjs/common';
import { ModelCtor, Sequelize } from 'sequelize-typescript';
import {
  CONNECTION_MAP,
  MODEL_DEFINITION_MAP,
  TENANT_CONNECTION,
} from '../tenancy.constants';
import { ConnectionMap, ModelDefinitionMap } from '../types';
import { getTenantModelDefinitionToken, getTenantModelToken } from '../utils';

export const createTeanancyProviders = (models: ModelCtor[]): Provider[] => {
  const providers: Provider[] = [];

  for (const model of models) {
    providers.push({
      provide: getTenantModelDefinitionToken(model.name),
      useFactory: (
        modelDefinitionMap: ModelDefinitionMap,
        connectionMap: ConnectionMap,
      ) => {
        const exists = modelDefinitionMap.has(model.name);
        if (!exists) {
          modelDefinitionMap.set(model.name, model);

          connectionMap.forEach((connection: Sequelize) => {
            connection.addModels([model]);
          });
        }
      },
      inject: [MODEL_DEFINITION_MAP, CONNECTION_MAP],
    });

    // Creating Models with connections attached
    providers.push({
      provide: getTenantModelToken(model.name),
      useFactory(tenantConnection: Sequelize) {
        return tenantConnection.model(model.name);
      },
      inject: [TENANT_CONNECTION],
    });
  }

  // Return the list of providers mapping
  return providers;
};
