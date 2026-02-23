import { test, expect } from "@playwright/test";

test("demo admin login navigates away from login", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Admin" }).click();

  await page.waitForURL(/\/(schedule|availability|employees|reports|my-shifts)/, {
    timeout: 15000,
  });
  await expect(page).not.toHaveURL(/\/login/);
});
