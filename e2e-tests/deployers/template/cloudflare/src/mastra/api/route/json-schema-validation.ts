import { registerApiRoute } from '@mastra/core/server';
import Ajv from 'ajv';

const validate = new Ajv().compile({
  type: 'object',
  properties: {
    city: { type: 'string' },
  },
  required: ['city'],
  additionalProperties: false,
});

export const jsonSchemaValidationRoute = registerApiRoute('/json-schema-validation', {
  method: 'POST',
  handler: async c => {
    const value = await c.req.json();

    if (!validate(value)) {
      return c.json({ valid: false, issues: validate.errors }, 400);
    }

    return c.json({ valid: true, value });
  },
});
