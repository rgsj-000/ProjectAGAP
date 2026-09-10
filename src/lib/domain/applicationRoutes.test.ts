import { describe, expect, it } from "vitest";
import {
  HOUSEHOLD_HOME,
  LOGIN_PATH,
  OPERATIONS_HOME,
  PUBLIC_HOME,
} from "./applicationRoutes";

describe("application routes", () => {
  it("keeps public and authenticated entry paths distinct", () => {
    expect({
      PUBLIC_HOME,
      LOGIN_PATH,
      OPERATIONS_HOME,
      HOUSEHOLD_HOME,
    }).toEqual({
      PUBLIC_HOME: "/",
      LOGIN_PATH: "/login",
      OPERATIONS_HOME: "/operations",
      HOUSEHOLD_HOME: "/household",
    });
  });
});
