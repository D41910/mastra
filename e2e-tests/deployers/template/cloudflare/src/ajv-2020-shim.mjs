import { Validator } from '@cfworker/json-schema';

export default class Ajv2020 {
  compile(schema) {
    const validator = new Validator(schema, '2020-12', false);
    const validate = value => {
      const result = validator.validate(value);
      validate.errors = result.errors.map(error => ({
        instancePath: error.instanceLocation ?? '',
        message: error.error,
      }));
      return result.valid;
    };
    validate.errors = [];
    return validate;
  }
}
