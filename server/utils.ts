import { XMLParser } from "fast-xml-parser"

export const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_"})

// turn an array into and object with keys from predicate
export const groupBy = <T>(array: T[], predicate: (value: T, index: number, array: T[]) => string) =>
  array.reduce((acc, value, index, array) => {
    (acc[predicate(value, index, array)] ||= []).push(value)
    return acc
}, {} as { [key: string]: T[] })