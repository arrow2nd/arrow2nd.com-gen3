import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Card from ".";

const meta = {
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    slug: "sample",
    title: "サンプル作品",
    thumbnail: "https://placehold.jp/ffffff/000000/1280x720.png?text=sample",
  },
};
