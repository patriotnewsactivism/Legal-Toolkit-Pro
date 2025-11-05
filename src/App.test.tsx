import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders toolkit header", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /Legal Toolkit Pro/i });
  expect(heading).toBeInTheDocument();
  expect(heading.tagName).toBe("H1");
});
