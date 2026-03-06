import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

test("Button renders children", () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole("button", { name: /click me/i })).toBeDefined();
});

test("Button accepts variant and size props", () => {
  const { container } = render(
    <Button variant="destructive" size="lg">
      Delete
    </Button>
  );
  const btn = screen.getByRole("button", { name: /delete/i });
  expect(btn).toBeDefined();
  expect(btn.getAttribute("data-variant")).toBe("destructive");
  expect(btn.getAttribute("data-size")).toBe("lg");
});
