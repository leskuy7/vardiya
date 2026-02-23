import { test, expect } from "@playwright/test";

test("login page renders core elements", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /Vardiya Planlayici/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Giris Yap/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Admin/i })).toBeVisible();
});

test("public root loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\//);
});
