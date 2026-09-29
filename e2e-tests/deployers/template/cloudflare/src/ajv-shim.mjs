import { Validator } from '@cfworker/json-schema';

export class Ajv {
  compile(schema) {
    const validator = new Validator(schema, 'draft-07', false);
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

export default Ajv;
