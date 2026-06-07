"use client";

import { Drawer } from "@arrow2nd/vaul";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import styles from "./index.module.css";

export default function WorksDrawer({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <Drawer.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={styles.overlay} />
        <Drawer.Content className={styles.content}>{children}</Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
