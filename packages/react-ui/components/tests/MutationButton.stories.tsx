import React from "react";
import { Story, Meta } from "@storybook/react";
import { MutationButton, MutationButtonProps } from "../MutationButton";
import { gql } from "@apollo/client";
import { VulcanComponentsProvider } from "../VulcanComponents";
export default {
  component: MutationButton,
  title: "MutationButton",
  decorators: [
    (Story) => (
      <VulcanComponentsProvider>
        <Story />
      </VulcanComponentsProvider>
    ),
  ],
  args: {
    mutation: gql`
      mutation sampleMutation($input: Input) {
        hello
      }
    `,
    mutationArguments: { input: { foo: "bar" } },
    loadingButtonProps: {
      label: "Click me",
    },
  },
  parameters: { actions: { argTypesRegex: "^.*Callback$" } },
} as Meta<MutationButtonProps>;

const MutationButtonTemplate: Story<MutationButtonProps> = (args) => (
  <MutationButton {...args} />
);
export const DefaultMutationButton = MutationButtonTemplate.bind({});
