import { BadRequestException } from '@nestjs/common';
import { ZodError, ZodTypeAny, infer as zInfer } from 'zod';

function formatZodError(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return 'Requête invalide.';
  }

  const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}

export function validateInput<TSchema extends ZodTypeAny>(
  schema: TSchema,
  input: unknown
): zInfer<TSchema> {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(formatZodError(error));
    }

    throw error;
  }
}
