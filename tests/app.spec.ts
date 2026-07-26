import { expect, test } from "@playwright/test";

test("visitor moves from the loading surface into New Model Motors", async ({
  page,
}) => {
  const loadingSurface = page.getByRole("status", {
    name: "Loading New Model Motors",
  });

  await page.goto("/");

  await expect(loadingSurface).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "New Model Motors" }),
  ).toBeVisible();
  await expect(loadingSurface).toBeHidden();
});
