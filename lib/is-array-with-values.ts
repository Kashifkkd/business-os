/**
 * Returns true if the value is an array with at least one element.
 * Use for "has data" checks before rendering lists/tables.
 */
export function isArrayWithValues<T>(
    value: T[] | null | undefined
  ): value is T[] {
    return Array.isArray(value) && value.length > 0
  }
  