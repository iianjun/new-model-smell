import type { Page } from "@playwright/test";

export const loadingSurface = (page: Page) =>
  page.getByRole("status", {
    name: "Loading New Model Motors",
  });
