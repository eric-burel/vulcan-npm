import React, { useContext } from "react";

interface FormContextValue {
  addToDeletedValues: Function;
  addToFailureForm: Function;
  addToSubmitForm: Function;
  addToSuccessForm: Function;
  clearForm: Function;
  clearFormCallbacks: Function;
  clearFieldErrors: Function;
  currentValues: object;
  deletedValues: Array<any>;
  errors: Array<any>;
  getDocument: Function;
  getLabel: (fieldName: string, fieldLocale?: string) => string;
  initialDocument: object;
  isChanged: boolean;
  refetchForm: Function;
  // TODO: we deprecate this, it doesn't make sense to allow a child to setState this way
  // setFormState: Function;
  // FIXME: this type doesn't work, it doesn't necessarily have the event + it has to be defined
  submitForm: Function; //React.HTMLAttributes<HTMLFormElement>["onSubmit"];
  throwError: Function;
  updateCurrentValues: Function;
}

export const FormContext =
  React.createContext<FormContextValue | undefined>(undefined);

export const useFormContext = () => {
  const formContext = useContext(FormContext);
  if (!formContext)
    throw new Error(
      `A component is trying to access form context but it is undefined. Please wrap your component with a <Form>.
      You may be importing "FormContext" from different packages or have accidentaly made a copy of it?
      FormContext is exposed by "@vulcanjs/react-ui".`
    );
  return formContext;
};
