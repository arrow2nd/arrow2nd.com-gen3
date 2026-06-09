"use client";

import { Drawer } from "@arrow2nd/vaul";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import styles from "./index.module.css";

export default function WorksDrawer({ children }: PropsWithChildren) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      onAnimationEnd={(isOpen) => {
        if (!isOpen) {
          router.back();
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={styles.overlay} />
        <Drawer.Content className={styles.content}>
          <div className={styles.handle}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i.toString()} className={styles.handleDot} />
            ))}
          </div>
          <div className={styles.inner}>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
