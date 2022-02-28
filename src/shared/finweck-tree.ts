function lowBit (n: number): number {
  return n & -n
}

export class FinweckTree {
  l: number
  ft: number[]
  map: Map<number, number>

  /**
   * @param l length of the array
   */
  constructor (l: number) {
    this.l = l
    this.ft = Array(l + 1).fill(0)
    this.map = new Map()
  }

  /**
   * Add arr[i] by n, start from 0
   * @param i the index of the element to be added
   * @param n the value to be added
   * @returns the value was successfully added
   */
  add (i: number, n: number): void {
    const { l, ft } = this
    if (n === 0 || i >= l) return
    this.map.set(i, this.get(i) + n)
    i += 1
    while (i <= l) {
      ft[i] += n
      i += lowBit(i)
    }
  }

  /**
   * Update arr[i] by v, start from 0
   * @param i the index of the element to be added
   * @param v the value to be updated
   * @returns the value was successfully updated
   */
  update (i: number, v: number): void {
    const pre = this.map.get(i) ?? 0
    if (pre !== v) {
      return this.add(i, v - pre)
    }
  }

  /**
   * Get the value of index i
   * @param i index
   * @returns value of the index
   */
  get (i: number): number {
    return this.map.get(i) ?? 0
  }

  /**
   * Get the sum of first i elements
   * @param i count of head elements to be added
   * @returns the sum of first i elements
   */
  sum (i?: number): number {
    if (i === 0) return 0
    const { ft, l } = this
    if (i === undefined) i = l
    if (i > l) throw new Error('[FinweckTree.sum]: `i` is larger than length.')
    let sum = 0
    while (i > 0) {
      sum += ft[i]
      i -= lowBit(i)
    }
    return sum
  }

  /**
   * Get the largest count of head elements whose sum are <= threshold
   * @param threshold
   * @returns the largest count of head elements whose sum are <= threshold
   */
  getBound (threshold: number): number {
    let l = 0
    let r = this.l
    while (r > l) {
      const m = Math.floor((l + r) / 2)
      const sumM = this.sum(m)
      if (sumM > threshold) {
        r = m
        continue
      } else if (sumM < threshold) {
        if (l === m) {
          if (this.sum(l + 1) <= threshold) return l + 1
          return m
        }
        l = m
      } else {
        return m
      }
    }
    return l
  }
}
