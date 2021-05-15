function lowBit (n: number): number {
  return n & -n
}

export class FinweckTree {
  l: number
  min: number
  ft: number[]

  /**
   * @param l length of the array
   * @param min min value of the array
   */
  constructor (l: number, min: number) {
    this.l = l
    this.min = min
    const ft = new Array(l + 1)
    for (let i = 0; i < l + 1; ++i) {
      ft[i] = 0
    }
    this.ft = ft
  }

  /**
   * Add arr[i] by n, start from 0
   * @param i the index of the element to be added
   * @param n the value to be added
   */
  add (i: number, n: number): void {
    const { l, ft } = this
    i += 1
    while (i <= l) {
      ft[i] += n
      i += lowBit(i)
    }
  }

  /**
   * Get the sum of first i elements
   * @param i count of head elements to be added
   * @returns the sum of first i elements
   */
  sum (i: number): number {
    const { ft, min, l } = this
    if (i > l) throw new Error('[FinweckTree.sum]: `i` is larger than length.')
    let ret = i * min
    while (i > 0) {
      ret += ft[i]
      i -= lowBit(i)
    }
    return ret
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
          console.log('xxx', l, this.sum(l + 1))
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
