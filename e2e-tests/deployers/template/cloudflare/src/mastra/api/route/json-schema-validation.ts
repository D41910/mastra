import { registerApiRoute } from '@mastra/core/server';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/client/validators/ajv';

const validate = new AjvJsonSchemaValidator().getValidator<{ city: string }>({
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

    const result = validate(value);
    if (!result.valid) {
      return c.json({ valid: false, issues: result.errorMessage }, 400);
    }

    return c.json({ valid: true, value: result.data });
  },
});
