import { AuthApiError } from '@/features/auth/_domain/auth-client';

type FormErrorMap<TField extends string> = Partial<Record<TField, string>>;

export type AuthFormErrorState<TField extends string> = {
  formError: string | null;
  fieldErrors: FormErrorMap<TField>;
};

const FALLBACK_FORM_ERROR = 'Something went wrong. Please try again.';

export function mapAuthApiErrorToFormErrors<TField extends string>(
  error: unknown,
  knownFields: ReadonlyArray<TField>,
): AuthFormErrorState<TField> {
  const fieldErrors: FormErrorMap<TField> = {};

  if (error instanceof AuthApiError) {
    for (const detail of error.details ?? []) {
      const candidateField = detail.path as TField;
      if (!knownFields.includes(candidateField)) {
        continue;
      }

      if (!fieldErrors[candidateField]) {
        fieldErrors[candidateField] = detail.message;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        formError: null,
        fieldErrors,
      };
    }

    return {
      formError: error.message || FALLBACK_FORM_ERROR,
      fieldErrors,
    };
  }

  if (error instanceof Error) {
    return {
      formError: error.message || FALLBACK_FORM_ERROR,
      fieldErrors,
    };
  }

  return {
    formError: FALLBACK_FORM_ERROR,
    fieldErrors,
  };
}
