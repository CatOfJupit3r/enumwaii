// @ts-check
import { ROLE, acceptRole } from "./reexport.js";

acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // syntax-only rule can reject this direct literal

const raw = "ADMIN";
acceptRole(raw); // syntax-only analysis cannot prove this is raw
