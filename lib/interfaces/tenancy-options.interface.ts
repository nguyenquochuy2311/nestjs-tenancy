import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Dialect } from 'sequelize';

/**
 * Options for synchronous setup
 *
 * @export
 * @interface TenancyModuleOptions
 */
export interface TenancyModuleOptions extends Record<string, any> {
  /**
   * Provide tenantId directly
   */
  tenantId?: string;

  /**
   * If `true`, tenant id will be extracted from the subdomain
   */
  isTenantFromSubdomain?: boolean;

  /**
   * Tenant id will be extracted using the keyword from the request header
   */
  tenantIdentifier?: string;

  /**
   * The dialect of the database you are connecting to. One of mysql, postgres, sqlite, mariadb and mssql.
   *
   * @default 'mysql'
   */
  dialect?: Dialect;

  /**
   * The name of the database
   */
  database?: string;

  /**
   * The username which is used to authenticate against the database.
   */
  username?: string;

  /**
   * The password which is used to authenticate against the database.
   */
  password?: string;

  /**
   * The host of the relational database.
   *
   * @default 'localhost'
   */
  host?: string;

  /**
   * The port of the relational database.
   */
  port?: number;

  /**
   * A flag that defines if is used SSL.
   */
  ssl?: boolean;

  /**
   * The protocol of the relational database.
   *
   * @default 'tcp'
   */
  protocol?: string;

  /**
   * The timezone used when converting a date from the database into a JavaScript date. The timezone is also
   * used to SET TIMEZONE when connecting to the server, to ensure that the result of NOW, CURRENT_TIMESTAMP
   * and other time related functions have in the right timezone. For best cross platform performance use the
   * format
   * +/-HH:MM. Will also accept string versions of timezones used by moment.js (e.g. 'America/Los_Angeles');
   * this is useful to capture daylight savings time changes.
   *
   * @default '+00:00'
   */
  timezone?: string;

  /**
   * URI for the tenant database
   */
  uri?: (tenant: string) => string;

  /**
   * Used for applying custom validations
   */
  validator?: (tenantId: string) => TenancyValidator;

  /**
   * Whitelist following subdomains
   */
  whitelist?: any;

  /**
   * Option to create the collections that are mapped to the tenant module
   * automatically while requesting for the tenant connection for the
   * first time. This option is useful in case on mongo transactions, where
   * transactions doens't create a collection if it does't exist already.
   */
  forceCreateCollections?: boolean;

  /**
   * Logging for Sequelize
   */
  logging?: boolean | ((sql: string, timing?: number) => void);
}

/**
 * For creating options dynamically
 * 
 * To use this the class implementing `TenancyOptionsFactory` should 
 * implement the method `createTenancyOptions` under it.
 *
 * @export
 * @interface TenancyOptionsFactory
 */
export interface TenancyOptionsFactory {
    createTenancyOptions():Promise<TenancyModuleOptions> | TenancyModuleOptions;
}

/**
 * Options for asynchronous setup
 *
 * @export
 * @interface TenancyModuleAsyncOptions
 */
export interface TenancyModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<TenancyOptionsFactory>;
    useClass?: Type<TenancyOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<TenancyModuleOptions> | TenancyModuleOptions;
    inject?: any[];
}

/**
 * Tenancy validator interface
 * Note: The implementation controls the validation of the tenant
 * `validate` method will be called by the platform if valdation is set in the 
 * parent application.
 *
 * @export
 * @interface TenancyValidator
 */
export interface TenancyValidator {

    /**
     * Set the tenant id and return the instance of the class
     * Note: This is the method that should be called by the implementing
     * application
     *
     * @param {string} tenantId
     * @returns {TenancyValidator}
     * @memberof TenancyValidator
     */
    setTenantId(tenantId: string): TenancyValidator;

    /**
     * This call will be invoked internally by the library
     *
     * @memberof TenancyValidator
     */
    validate(): Promise<void>;
}