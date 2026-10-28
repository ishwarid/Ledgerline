import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionFilters } from "./transaction-filters";

const replace = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/transactions",
  useSearchParams: () => currentParams,
}));

const accounts = [
  { id: "acc-1", label: "Spending" },
  { id: "acc-2", label: "House deposit" },
];

describe("TransactionFilters", () => {
  beforeEach(() => {
    replace.mockClear();
    currentParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the selected account to the URL", async () => {
    const user = userEvent.setup();
    render(<TransactionFilters accounts={accounts} />);

    await user.selectOptions(screen.getByLabelText("Account"), "acc-2");

    expect(replace).toHaveBeenCalledWith("/transactions?account=acc-2", { scroll: false });
  });

  it("resets to page one when a filter changes", async () => {
    currentParams = new URLSearchParams("page=4&category=Groceries");
    const user = userEvent.setup();
    render(<TransactionFilters accounts={accounts} />);

    await user.selectOptions(screen.getByLabelText("Direction"), "out");

    expect(replace).toHaveBeenCalledWith("/transactions?category=Groceries&direction=out", {
      scroll: false,
    });
  });

  it("waits for typing to pause before searching", () => {
    vi.useFakeTimers();
    render(<TransactionFilters accounts={accounts} />);
    const search = screen.getByLabelText("Search");

    fireEvent.change(search, { target: { value: "fu" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.change(search, { target: { value: "fuel" } });
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/transactions?q=fuel", { scroll: false });
  });

  it("hides the clear button until something is filtered", () => {
    const { rerender } = render(<TransactionFilters accounts={accounts} />);
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeDisabled();

    currentParams = new URLSearchParams("q=rent");
    rerender(<TransactionFilters accounts={accounts} />);
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeEnabled();
  });
});
