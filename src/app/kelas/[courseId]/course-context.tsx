"use client";

import { createContext, useContext } from "react";
import type { Course, Member } from "@/lib/data";

export type CourseState = { cid: string; course: Course; me: Member };

export const CourseContext = createContext<CourseState | null>(null);

export function useCourse() {
  const value = useContext(CourseContext);
  if (!value) throw new Error("useCourse must be used inside the course layout");
  return value;
}
