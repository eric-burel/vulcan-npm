import React from "react";
// Load only the type, to define the API for each component
// TODO: maybe do the reverse, define the props here and an unstyled version of the component?
import type { FormSubmitProps } from "../form/FormSubmit";
import type { ButtonProps } from "../form/core/Button";
import type { MutationButtonProps } from "../MutationButton";
import type {
  Datatable,
  DatatableAbove,
  DatatableAboveLayout,
  DatatableAboveLeft,
  DatatableAboveRight,
  DatatableAboveSearchInput,
  DatatableLayout,
} from "../Datatable/Datatable";
import type {
  DatatableContents,
  DatatableContentsBodyLayout,
  DatatableContentsHeadLayout,
  DatatableContentsInnerLayout,
  DatatableContentsLayout,
  DatatableContentsMoreLayout,
  DatatableEmpty,
  DatatableLoadMoreButton,
  DatatableTitle,
} from "../Datatable/DatatableContents";
import type {
  DatatableHeader,
  DatatableHeaderCellLayout,
} from "../Datatable/DatatableHeader";
import type {
  DatatableRow,
  DatatableRowLayout,
} from "../Datatable/DatatableRow";
import type {
  DatatableCell,
  DatatableCellLayout,
  DatatableDefaultCell,
} from "../Datatable/DatatableCell";

export interface PossibleCoreComponents {
  Loading: any;
  FormattedMessage: any;
  Alert: any;
  Button: React.ComponentType<ButtonProps>;
  Icon: any;
  // TODO: define props more precisely
  MutationButton: React.ComponentType<MutationButtonProps>;
  LoadingButton: React.ComponentType<any>;
  HeadTags: React.ComponentType<any>;
  // Previously from Bootstrap and Mui
  TooltipTrigger: React.ComponentType<any>;
  Dropdown: React.ComponentType<any>;
}
// TODO: differentiate components that are provided out of the box and those that require a UI frameworK?
export interface PossibleFormComponents {
  FormError: any; // FieldErrors
  // From FormComponent
  FormComponentDefault: any;
  FormComponentPassword: any;
  FormComponentNumber: any;
  FormComponentUrl: any;
  FormComponentEmail: any;
  FormComponentTextarea: any;
  FormComponentCheckbox: any;
  FormComponentCheckboxGroup: any;
  FormComponentRadioGroup: any;
  FormComponentSelect: any;
  FormComponentSelectMultiple: any;
  FormComponentDateTime: any;
  FormComponentDate: any;
  // FormComponentDate2: any;
  FormComponentTime: any;
  FormComponentStaticText: any;
  FormComponentLikert: any;
  FormComponentAutocomplete: any;
  FormComponentMultiAutocomplete: any;
  //
  FormComponent: any;
  FormComponentInner: any;
  FormComponentLoader: any;
  FormElement: any;
  FormGroup: any;
  FormGroupLayout: any;
  FormGroupHeader: any;
  // intl
  FormIntlLayout: any;
  FormIntlItemLayout: any;
  FormIntl: any;
  // Layout
  FormErrors: any;
  FormSubmit: React.ComponentType<FormSubmitProps>;
  FormLayout: any;

  // arrays and objects
  FormNestedArray: any;
  FormNestedArrayInnerLayout: any;
  FormNestedArrayLayout: any;
  FormNestedItem: any;
  IconAdd: any;
  IconRemove: any;
  FieldErrors: any;
  FormNestedDivider: any;
  //
  FormNestedItemLayout: any;
  FormNestedObjectLayout: any;
  FormNestedObject: any;
  FormOptionLabel: any;
  // Form
  Form: any;
  // Used by ui-boostrap and ui-material
  FormItem;
  // flag to detect parent state
  __not_intialized?: boolean;
}

export interface DatatableComponents {
  Datatable: typeof Datatable;
  // DatatableContents: typeof DatatableContents
  DatatableAbove: typeof DatatableAbove;
  DatatableAboveLayout: typeof DatatableAboveLayout;
  DatatableAboveLeft: typeof DatatableAboveLeft;
  DatatableAboveRight: typeof DatatableAboveRight;
  DatatableAboveSearchInput: typeof DatatableAboveSearchInput;
  DatatableLayout: typeof DatatableLayout;
  // Contents
  DatatableContents: typeof DatatableContents;
  DatatableContentsBodyLayout: typeof DatatableContentsBodyLayout;
  DatatableContentsHeadLayout: typeof DatatableContentsHeadLayout;
  DatatableContentsInnerLayout: typeof DatatableContentsInnerLayout;
  DatatableContentsLayout: typeof DatatableContentsLayout;
  DatatableContentsMoreLayout: typeof DatatableContentsMoreLayout;
  DatatableEmpty: typeof DatatableEmpty;
  DatatableLoadMoreButton: typeof DatatableLoadMoreButton;
  DatatableTitle: typeof DatatableTitle;
  // Header
  DatatableHeader: typeof DatatableHeader;
  DatatableHeaderCellLayout: typeof DatatableHeaderCellLayout;
  // Row
  DatatableRow: typeof DatatableRow;
  DatatableRowLayout: typeof DatatableRowLayout;
  // Cell
  DatatableCell: typeof DatatableCell;
  DatatableCellLayout: typeof DatatableCellLayout;
  DatatableDefaultCell: typeof DatatableDefaultCell;
}

export type PossibleVulcanComponents = PossibleCoreComponents &
  PossibleFormComponents &
  DatatableComponents;
