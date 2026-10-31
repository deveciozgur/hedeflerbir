import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const initials = (name: string, surname: string) =>
  `${name.charAt(0)}${surname.charAt(0)}`.toLocaleUpperCase("tr-TR");

export const fullName = (person: { name: string; surname: string }) => `${person.name} ${person.surname}`;

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
