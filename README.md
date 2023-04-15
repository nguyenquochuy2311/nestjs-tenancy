# nestjs-tenancy

A simple easy to use multitenancy module for NestJs and Sequelize

<a href="https://www.npmjs.com/package/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-tenancy.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-tenancy.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/dm/nestjs-tenancy.svg" alt="NPM Downloads" /></a>

## Description

Multitenancy Module for [Nest](https://github.com/nestjs/nest) using [Sequelize](https://sequelize.org/) or [Sequelize TypeScript](https://www.npmjs.com/package/sequelize-typescript).

## Installation

```bash
$ npm i --save nestjs-tenancy
```

## Basic usage

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";

import { TenancyModule } from "nestjs-tenancy";

import { UserModule } from "./user.module.ts";

@Module({
  imports: [
    TenancyModule.forRoot({
      tenantIdentifier: 'X-TENANT',
      uri: (tenant: string) => 
        `postgresql://postgresql:@127.0.0.1:5432/${tenant}?schema=public`,
    }),
    UserModule,
  ],
})
export class AppModule {}
```

Create your Sequelize model

**user.model.ts**

```typescript
import { 
  Table, 
  Model, 
  Column, 
  PrimaryKey 
} from 'sequelize-typescript';

@Table()
export class User extends Model {
    @Column()
    name: string;

    @Column()
    email: number;

    @Column()
    password: string;
}
```

Inject User for `UserModule`

**user.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TenancyModule } from 'nestjs-tenancy';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.model';

@Module({
  imports: [
    TenancyModule.forFeature([User])
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
```

Get the User model in a service

**user.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectTenancyModel } from 'nestjs-tenancy';
import { User } from './user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectTenancyModel(User.name) 
    private readonly user: typeof User
  ) { }

  async create(user: Partial<User>): Promise<User> {
    return this.user.create(user);
  }

  async findAll(): Promise<User[]> {
    return this.user.findAll<User>();
  }
}
```

Finally, use the service in a controller!

**user.controller.ts**

```typescript

import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';

@Controller('user')
export class UserController {
  constructor(private readonly user: UserService) { }

  @Post()
  async create(@Body() user: Partial<User>) {
    return this.user.create(user);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.user.findAll();
  }
}
```

## Adding custom validators for the tenant

Let's say you want to handle a validation check to see if your tenant is registered. You can do 
this by implementing the `TenancyValidator` interface and writing your own validation logic inside
the `validate` method. The library invokes this method internally.

### Note
Here we assume that `X-TENANT` is passed in the request header so that its available for the validator.

**custom-tenant.validator.ts**

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/sequelize';

import { TenancyValidator } from "nestjs-tenancy";

import { Tenant } from './tenant.model';

@Injectable()
export class CustomTenantValidator implements TenancyValidator {
    private _tenantId: string;

    // This`Tenant` model definition schema is mapped to the common database and
    // not into the tenant database.
    constructor(@InjectModel(Tenant) private tenant: typeof Tenant) { }

    /**
     * Method to set the tenant id
     *
     * @param {string} tenantId
     * @returns
     * @memberof CustomTenantValidator
     */
    setTenantId(tenantId: string): TenancyValidator {
        this._tenantId = tenantId;
        return this; // Make sure to return the instance of the class back here.
    }

    /**
     * Your Custom Validation to verify if tenant exist in the common database
     *
     * Note: This method will be invoked by the library internally when
     * tenant id is present in the context.
     *
     * @returns {Promise<void>}
     * @memberof CustomTenantValidator
     */
    async validate(): Promise<void> {
        const exist = await this.tenant.exists({ name: this._tenantId });
        if (!exist) {
            throw new NotFoundException(`Tenant not found`);
        }
    }
}
```

Export the validator from your tenant module

**tenant.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Tenant } from './tenant.model';
import { CustomTenantValidator } from './custom-tenant.validator';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    // Here the connection represents the common database
    SequelizeModule.forFeature([Tenant])
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    // Your custom validator
    CustomTenantValidator,
  ],
  exports: [
    TenantService,
    CustomTenantValidator,
  ]
})
export class TenantModule {}
```

Finally you will also need to modify the module configuration.

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";

import { TenancyModule } from "nestjs-tenancy";

import { UserModule } from "./user.module";
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    TenancyModule.forRootAsync({
      imports: [TenantModule]
      useFactory: async (validator: CustomTenantValidator) => {
        return {
          tenantIdentifier: 'X-TENANT',
          uri: (tenantId: string) => 
            `postgresql://postgresql:@127.0.0.1:5432/${tenantId}?schema=public`,
          validator: (tenantId: string) => validator.setTenantId(tenantId)
        };
      },
      inject: [CustomTenantValidator]
    }),
    UserModule,
  ],
})
export class AppModule {}
```

## Subdomain support

This library also enables the extraction of tenant id from the sudomain of the url.
For enabling this you need to modify your configuration like below.

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";

import { TenancyModule } from "nestjs-tenancy";

import { UserModule } from "./user.module.ts";

@Module({
  imports: [
    TenancyModule.forRoot({
      isTenantFromSubdomain: true,
      uri: (tenant: string) => 
        `postgresql://postgresql:@127.0.0.1:5432/${tenant}?schema=public`,
    }),
    UserModule,
  ],
})
export class AppModule {}
```

## Requirements

1.  sequelize ^6.6.5 
2.  sequelize-typescript ^2.1.0

## Test

```bash
# e2e tests
$ npm run test:e2e
```

## License

  Nest is [MIT licensed](LICENSE).

## Credits

This is forked from [@needle-innovision/nestjs-tenancy](https://github.com/needle-innovision/nestjs-tenancy) which is built for [Mongoose](http://mongoosejs.com/) do checkout if you need Multi Tenancy for your Mongoose based NestJs App.
