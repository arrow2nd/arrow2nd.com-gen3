import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DashedHeading from ".";

const meta = {
  component: DashedHeading,
} satisfies Meta<typeof DashedHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "これ好き",
  },
};

export const English: Story = {
  args: {
    children: "web",
    lang: "en",
  },
};

export const H3: Story = {
  args: {
    as: "h3",
    children: "経歴",
  },
};
