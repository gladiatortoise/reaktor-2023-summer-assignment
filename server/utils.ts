import { XMLParser } from "fast-xml-parser"

export const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_"})

export const groupBy = <T>(array: T[], predicate: (value: T, index: number, array: T[]) => string) =>
  array.reduce((acc, value, index, array) => {
    (acc[predicate(value, index, array)] ||= []).push(value)
    return acc
}, {} as { [key: string]: T[] })